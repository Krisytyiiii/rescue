import type {
  LearningLesson,
  LearningModule,
  LearningModuleSummary,
} from "@/domain/learning";
import type { SessionStorage } from "@/domain/ports";

import { webUrl } from "./config";
import { requestJson } from "./http";
import type { LearningDataSource } from "./learning";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function normalizeLesson(lesson: LearningLesson): LearningLesson {
  return {
    ...lesson,
    mediaUrl: absoluteUrl(lesson.mediaUrl),
  };
}

function normalizeModule(module: LearningModuleSummary): LearningModuleSummary {
  return {
    ...module,
    coverImageUrl: absoluteUrl(module.coverImageUrl),
  };
}

/** HTTP implementation of the published learning port. */
export class HttpLearningGateway implements LearningDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadModules(): Promise<LearningModuleSummary[]> {
    const token = (await this.session.read())?.token;

    const modules = await requestJson<LearningModuleSummary[]>(
      "/api/learning/modules",
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load the learning modules.",
      },
    );

    return modules.map(normalizeModule);
  }

  async loadModule(id: number): Promise<LearningModule> {
    const token = (await this.session.read())?.token;

    const module = await requestJson<LearningModule>(
      `/api/learning/modules/${id}`,
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load this course.",
      },
    );

    return {
      ...normalizeModule(module),
      lessons: module.lessons
        .map(normalizeLesson)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }
}
