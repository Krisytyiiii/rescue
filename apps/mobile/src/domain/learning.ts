export type LearningCategory =
  | "responsible_ownership"
  | "dog_behavior"
  | "cat_behavior"
  | "basic_training"
  | "health_care";

export type LessonContentType = "text" | "video" | "image" | "pdf";

export const LEARNING_CATEGORY_LABEL: Record<LearningCategory, string> = {
  responsible_ownership: "Responsible ownership",
  dog_behavior: "Dog behavior",
  cat_behavior: "Cat behavior",
  basic_training: "Basic training",
  health_care: "Health care",
};

/** One lesson inside an admin-published course. */
export interface LearningLesson {
  id: number;
  title: string;
  contentType: LessonContentType;
  contentBody: string | null;
  mediaUrl: string | null;
  durationMinutes: number | null;
  sortOrder: number;
}

/** Card-level course data shown in the module list. */
export interface LearningModuleSummary {
  id: number;
  title: string;
  category: LearningCategory;
  description: string | null;
  coverImageUrl: string | null;
  lessonCount: number;
  totalMinutes: number;
}

/** A course with its full lesson content. */
export interface LearningModule extends LearningModuleSummary {
  lessons: LearningLesson[];
}
