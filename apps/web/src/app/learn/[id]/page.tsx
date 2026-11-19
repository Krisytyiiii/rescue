import type { Metadata } from "next";
import { ArrowLeft, PawPrint } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { authService, learningService } from "@furescue/core";

import { Badge } from "@/components/ui/badge";
import { CoursePlayer } from "@/components/learning/course-player";
import { readSession } from "@/lib/auth/session";
import { CATEGORY_META, formatMinutes } from "@/components/admin/learning/learning-types";

interface LearnCoursePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: LearnCoursePageProps): Promise<Metadata> {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return { title: "Course — FuRescue" };

  try {
    const course = await learningService.getPublishedModule(moduleId);
    return {
      title: `${course.title} — FuRescue Learn`,
      description: course.description ?? undefined,
    };
  } catch {
    return { title: "Course — FuRescue Learn" };
  }
}

export default async function LearnCoursePage({ params }: LearnCoursePageProps) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) notFound();

  const session = await readSession();
  let userId: string | undefined;
  if (session) {
    const user = await authService.me(session.sub).catch(() => null);
    userId = user?.id;
  }

  const course = await learningService
    .getPublishedModule(moduleId, userId)
    .catch(() => null);
  if (!course) notFound();

  const meta = CATEGORY_META[course.category];

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-ink/[0.07] bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-ink">
            <PawPrint className="h-4 w-4 text-clay" strokeWidth={2} />
            <span className="font-display text-[1.0625rem] tracking-[-0.02em]">
              FuRescue
            </span>
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink/55 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.9} />
            All courses
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} surface="light">
              {meta.label}
            </Badge>
            {course.progress?.completed && (
              <Badge tone="success" surface="light">
                Completed
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-display text-[clamp(1.85rem,4.5vw,2.65rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-[1.65] text-ink/60">
              {course.description}
            </p>
          )}
          <p className="mt-2 text-[0.6875rem] text-ink/40">
            {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"} ·{" "}
            {formatMinutes(course.totalMinutes)}
          </p>
        </div>

        {course.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt=""
            className="mb-6 h-56 w-full rounded-2xl border border-ink/[0.08] object-cover"
          />
        )}

        <CoursePlayer module={course} signedIn={Boolean(userId)} />
      </main>
    </div>
  );
}
