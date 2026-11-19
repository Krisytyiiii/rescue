import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";

export const learningModuleInclude = {
  lessons: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
} satisfies Prisma.LearningModuleInclude;

export class LearningRepository {
  constructor(private readonly db: Db = prisma) {}

  listModules() {
    return this.db.learningModule.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: learningModuleInclude,
    });
  }

  findModule(id: number) {
    return this.db.learningModule.findFirst({
      where: { id, deletedAt: null },
      include: learningModuleInclude,
    });
  }

  listPublishedModules() {
    return this.db.learningModule.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: [{ category: "asc" }, { id: "asc" }],
      include: learningModuleInclude,
    });
  }

  findPublishedModule(id: number) {
    return this.db.learningModule.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: learningModuleInclude,
    });
  }

  progressRows() {
    return this.db.userLearningProgress.findMany({
      select: {
        userId: true,
        lessonId: true,
        status: true,
        lesson: { select: { moduleId: true } },
      },
    });
  }

  userProgress(userId: string) {
    return this.db.userLearningProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        lesson: { select: { moduleId: true } },
      },
    });
  }
}

export const learningRepository = new LearningRepository();
