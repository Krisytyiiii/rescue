import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../../db/prisma.ts";
import { NotFoundError, ValidationError } from "../../shared/errors.ts";
import { requireActor, requireRole } from "../../shared/authz.ts";
import type { Actor } from "../../shared/types.ts";
import { LEARNING_CATEGORY_LABEL } from "./learning.types.ts";
import {
  LearningRepository,
  learningModuleInclude,
  learningRepository,
} from "./learning.repository.ts";
import type {
  LearnerModuleDetailDto,
  LearnerModuleSummaryDto,
  LearnerProgressDto,
  LearningLessonDto,
  LearningModuleDto,
  LearningModuleStats,
  SaveModuleInput,
} from "./learning.types.ts";

type ModuleRow = Prisma.LearningModuleGetPayload<{
  include: typeof learningModuleInclude;
}>;

type ProgressRow = Awaited<ReturnType<LearningRepository["progressRows"]>>[number];

function lessonDto(lesson: ModuleRow["lessons"][number]): LearningLessonDto {
  return {
    id: lesson.id,
    title: lesson.title,
    contentType: lesson.contentType,
    contentBody: lesson.contentBody,
    mediaUrl: lesson.mediaUrl,
    durationMinutes: lesson.durationMinutes,
    sortOrder: lesson.sortOrder ?? 0,
  };
}

function emptyStats(): LearningModuleStats {
  return {
    learners: 0,
    completions: 0,
    completionRate: 0,
  };
}

function buildStats(
  progress: ProgressRow[],
  lessonCounts: Map<number, number>,
): Map<number, LearningModuleStats> {
  const learners = new Map<number, Set<string>>();
  const completedLessons = new Map<string, number>();
  const moduleOfUser = new Map<string, number>();

  for (const row of progress) {
    const moduleId = row.lesson.moduleId;
    learners.get(moduleId) ?? learners.set(moduleId, new Set());
    learners.get(moduleId)!.add(row.userId);
    if (row.status === "completed") {
      const key = `${moduleId}:${row.userId}`;
      completedLessons.set(key, (completedLessons.get(key) ?? 0) + 1);
      moduleOfUser.set(key, moduleId);
    }
  }

  const completions = new Map<number, number>();
  for (const [key, completed] of completedLessons) {
    const moduleId = moduleOfUser.get(key)!;
    const total = lessonCounts.get(moduleId) ?? 0;
    if (total > 0 && completed >= total) {
      completions.set(moduleId, (completions.get(moduleId) ?? 0) + 1);
    }
  }

  const stats = new Map<number, LearningModuleStats>();
  for (const moduleId of learners.keys()) {
    const learnerCount = learners.get(moduleId)?.size ?? 0;
    const completionCount = completions.get(moduleId) ?? 0;
    stats.set(moduleId, {
      learners: learnerCount,
      completions: completionCount,
      completionRate:
        learnerCount > 0 ? Math.round((completionCount / learnerCount) * 100) : 0,
    });
  }
  return stats;
}


function moduleDto(row: ModuleRow, stats: LearningModuleStats): LearningModuleDto {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lessons: row.lessons.map(lessonDto),
    stats,
  };
}

function sumMinutes(lessons: Array<{ durationMinutes: number | null }>): number {
  return lessons.reduce((total, lesson) => total + (lesson.durationMinutes ?? 0), 0);
}

function userProgressFor(
  moduleId: number,
  progress: Array<{ lessonId: number; status: string; lesson: { moduleId: number } }>,
  lessonCount: number,
): LearnerProgressDto | null {
  const completed = progress.filter(
    (row) => row.lesson.moduleId === moduleId && row.status === "completed",
  );
  if (completed.length === 0) return null;

  return {
    completedLessonIds: completed.map((row) => row.lessonId),
    completed: lessonCount > 0 && completed.length >= lessonCount,
  };
}

export class LearningService {
  constructor(private readonly repo: LearningRepository = learningRepository) {}

  async listModules(actor?: Actor): Promise<LearningModuleDto[]> {
    requireRole(actor, "admin");
    const [modules, progress] = await Promise.all([
      this.repo.listModules(),
      this.repo.progressRows(),
    ]);
    const lessonCounts = new Map(
      modules.map((module) => [module.id, module.lessons.length]),
    );
    const stats = buildStats(progress, lessonCounts);
    return modules.map((module) =>
      moduleDto(module, stats.get(module.id) ?? emptyStats()),
    );
  }

  async getModule(id: number, actor?: Actor): Promise<LearningModuleDto> {
    requireRole(actor, "admin");
    const row = await this.repo.findModule(id);
    if (!row) throw new NotFoundError("Course");
    const progress = await this.repo.progressRows();
    const stats = buildStats(progress, new Map([[id, row.lessons.length]]));
    return moduleDto(row, stats.get(id) ?? emptyStats());
  }

  async saveModule(input: SaveModuleInput, actor?: Actor): Promise<LearningModuleDto> {
    const admin = requireRole(actor, "admin");
    this.validate(input);

    const saved = await prisma.$transaction(async (tx) => {
      const data = {
        title: input.title.trim(),
        category: input.category,
        description: input.description?.trim() || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        isPublished: input.isPublished,
      };

      const module = input.id
        ? await tx.learningModule.update({ where: { id: input.id }, data })
        : await tx.learningModule.create({
            data: { ...data, createdBy: admin.userId },
          });

      await this.syncLessons(tx, module.id, input);
      // Quizzes are no longer part of a course; drop any legacy rows.
      await tx.quiz.deleteMany({ where: { moduleId: module.id } });
      return module.id;
    });

    return this.getModule(saved, actor);
  }

  private validate(input: SaveModuleInput) {
    if (!input.title?.trim()) throw new ValidationError("A course title is required");
    if (!LEARNING_CATEGORY_LABEL[input.category]) {
      throw new ValidationError("Choose a valid category");
    }
    if (input.lessons.length === 0) {
      throw new ValidationError("Add at least one lesson before saving");
    }
    for (const lesson of input.lessons) {
      if (!lesson.title.trim()) throw new ValidationError("Every lesson needs a title");
    }
  }

  private async syncLessons(
    tx: Prisma.TransactionClient,
    moduleId: number,
    input: SaveModuleInput,
  ) {
    const existing = await tx.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((lesson) => lesson.id));
    const keepIds = input.lessons
      .map((lesson) => lesson.id)
      .filter((id): id is number => typeof id === "number" && existingIds.has(id));

    await tx.lesson.deleteMany({
      where: { moduleId, id: { notIn: keepIds.length > 0 ? keepIds : [-1] } },
    });

    for (const [index, lesson] of input.lessons.entries()) {
      const data = {
        title: lesson.title.trim(),
        contentType: lesson.contentType,
        contentBody: lesson.contentBody,
        mediaUrl: lesson.mediaUrl?.trim() || null,
        durationMinutes: lesson.durationMinutes,
        sortOrder: index,
      };
      if (lesson.id && existingIds.has(lesson.id)) {
        await tx.lesson.update({ where: { id: lesson.id }, data });
      } else {
        await tx.lesson.create({ data: { ...data, moduleId } });
      }
    }
  }

  setPublished(id: number, isPublished: boolean, actor?: Actor) {
    requireRole(actor, "admin");
    return prisma.learningModule.update({ where: { id }, data: { isPublished } });
  }

  async duplicateModule(id: number, actor?: Actor): Promise<LearningModuleDto> {
    requireRole(actor, "admin");
    const source = await this.repo.findModule(id);
    if (!source) throw new NotFoundError("Course");

    const copy = await prisma.learningModule.create({
      data: {
        title: `${source.title} (copy)`,
        category: source.category,
        description: source.description,
        coverImageUrl: source.coverImageUrl,
        isPublished: false,
        createdBy: actor?.userId ?? null,
        lessons: {
          create: source.lessons.map((lesson) => ({
            title: lesson.title,
            contentType: lesson.contentType,
            contentBody: lesson.contentBody,
            mediaUrl: lesson.mediaUrl,
            durationMinutes: lesson.durationMinutes,
            sortOrder: lesson.sortOrder,
          })),
        },
      },
    });

    return this.getModule(copy.id, actor);
  }

  async deleteModule(id: number, actor?: Actor) {
    requireRole(actor, "admin");
    return prisma.learningModule.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  }

  async listPublishedModules(userId?: string): Promise<LearnerModuleSummaryDto[]> {
    const [modules, progress] = await Promise.all([
      this.repo.listPublishedModules(),
      userId ? this.repo.userProgress(userId) : Promise.resolve([]),
    ]);

    return modules.map((module) => ({
      id: module.id,
      title: module.title,
      category: module.category,
      description: module.description,
      coverImageUrl: module.coverImageUrl,
      lessonCount: module.lessons.length,
      totalMinutes: sumMinutes(module.lessons),
      progress: userId
        ? userProgressFor(module.id, progress, module.lessons.length)
        : null,
    }));
  }

  async getPublishedModule(
    id: number,
    userId?: string,
  ): Promise<LearnerModuleDetailDto> {
    const [module, progress] = await Promise.all([
      this.repo.findPublishedModule(id),
      userId ? this.repo.userProgress(userId) : Promise.resolve([]),
    ]);
    if (!module) throw new NotFoundError("Course");

    return {
      id: module.id,
      title: module.title,
      category: module.category,
      description: module.description,
      coverImageUrl: module.coverImageUrl,
      lessonCount: module.lessons.length,
      totalMinutes: sumMinutes(module.lessons),
      lessons: module.lessons.map(lessonDto),
      progress: userId
        ? userProgressFor(module.id, progress, module.lessons.length)
        : null,
    };
  }

  async completeLesson(moduleId: number, lessonId: number, actor?: Actor) {
    const user = requireActor(actor);
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: { isPublished: true, deletedAt: null },
      },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundError("Lesson");

    const progress = await prisma.userLearningProgress.upsert({
      where: { userId_lessonId: { userId: user.userId, lessonId } },
      create: {
        userId: user.userId,
        lessonId,
        status: "completed",
        completedAt: new Date(),
      },
      update: { status: "completed", completedAt: new Date() },
    });

    return { lessonId: progress.lessonId, status: progress.status };
  }
}

export const learningService = new LearningService();
