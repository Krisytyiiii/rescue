import type {
  LearningCategory,
  LessonContentType,
  SaveModuleInput,
} from "@furescue/core";

import type { BadgeTone } from "@/components/ui/badge";

export type {
  LearnerModuleDetailDto,
  LearnerModuleSummaryDto,
  LearnerProgressDto,
  LearningLessonDto,
  LearningModuleDto,
  LearningModuleStats,
  LearningQuestionDto,
  LearningQuizDto,
  SaveModuleInput,
} from "@furescue/core";

export const CATEGORY_META: Record<
  LearningCategory,
  { label: string; tone: BadgeTone }
> = {
  responsible_ownership: { label: "Responsible ownership", tone: "info" },
  dog_behavior: { label: "Dog behavior", tone: "progress" },
  cat_behavior: { label: "Cat behavior", tone: "pending" },
  basic_training: { label: "Basic training", tone: "success" },
  health_care: { label: "Health care", tone: "warning" },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META) as Array<
  [LearningCategory, { label: string; tone: BadgeTone }]
>;

export const CONTENT_TYPE_LABEL: Record<LessonContentType, string> = {
  text: "Text",
  video: "Video",
  image: "Image",
  pdf: "PDF",
};

export const CONTENT_TYPE_OPTIONS = Object.entries(CONTENT_TYPE_LABEL) as Array<
  [LessonContentType, string]
>;

export interface LearningSubmit {
  input: SaveModuleInput;
  thumbnail: File | null;
  lessonFiles: Array<File | null>;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
