import type {
  LearningCategory,
  LessonContentType,
} from "../../generated/prisma/enums.ts";

export const LEARNING_CATEGORY_LABEL: Record<LearningCategory, string> = {
  responsible_ownership: "Responsible ownership",
  dog_behavior: "Dog behavior",
  cat_behavior: "Cat behavior",
  basic_training: "Basic training",
  health_care: "Health care",
};

export const LEARNING_CATEGORIES = Object.keys(
  LEARNING_CATEGORY_LABEL,
) as LearningCategory[];

export const LESSON_CONTENT_LABEL: Record<LessonContentType, string> = {
  text: "Text",
  video: "Video",
  image: "Image",
  pdf: "PDF",
};

export interface LearningQuestionDto {
  id: number;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string | null;
}

export interface LearningLessonDto {
  id: number;
  title: string;
  contentType: LessonContentType;
  contentBody: string | null;
  mediaUrl: string | null;
  durationMinutes: number | null;
  sortOrder: number;
}

export interface LearningQuizDto {
  id: number;
  title: string;
  passingScore: number;
  questions: LearningQuestionDto[];
}

export interface LearningModuleStats {
  learners: number;
  completions: number;
  completionRate: number;
}

export interface LearningModuleDto {
  id: number;
  title: string;
  category: LearningCategory;
  description: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lessons: LearningLessonDto[];
  stats: LearningModuleStats;
}

export interface LearnerProgressDto {
  completedLessonIds: number[];
  completed: boolean;
}

export interface LearnerModuleSummaryDto {
  id: number;
  title: string;
  category: LearningCategory;
  description: string | null;
  coverImageUrl: string | null;
  lessonCount: number;
  totalMinutes: number;
  progress: LearnerProgressDto | null;
}

export interface LearnerModuleDetailDto extends LearnerModuleSummaryDto {
  lessons: LearningLessonDto[];
}

export interface SaveLessonInput {
  id?: number;
  title: string;
  contentType: LessonContentType;
  contentBody: string | null;
  mediaUrl: string | null;
  durationMinutes: number | null;
}

export interface SaveModuleInput {
  /** Set when updating an existing course. */
  id?: number;
  title: string;
  category: LearningCategory;
  description: string | null;
  coverImageUrl: string | null;
  isPublished: boolean;
  lessons: SaveLessonInput[];
}
