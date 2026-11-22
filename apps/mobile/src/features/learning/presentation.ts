import type { LearningCategory, LessonContentType } from "@/domain/learning";

export const CATEGORY_LABEL: Record<LearningCategory, string> = {
  responsible_ownership: "Responsible ownership",
  dog_behavior: "Dog behavior",
  cat_behavior: "Cat behavior",
  basic_training: "Basic training",
  health_care: "Health care",
};

export const CONTENT_LABEL: Record<LessonContentType, string> = {
  text: "Reading",
  video: "Video",
  image: "Image",
  pdf: "PDF",
};

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function lessonMeta(lessonCount: number, totalMinutes: number): string {
  const lessons = `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`;
  return `${lessons} · ${formatMinutes(totalMinutes)}`;
}
