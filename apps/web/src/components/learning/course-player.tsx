"use client";

import { Check, CheckCircle2, Circle, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

import type { LearnerModuleDetailDto } from "@/components/admin/learning/learning-types";

interface CoursePlayerProps {
  module: LearnerModuleDetailDto;
  signedIn: boolean;
}

export function CoursePlayer({ module, signedIn }: CoursePlayerProps) {
  const toast = useToast();
  const [activeId, setActiveId] = useState(module.lessons[0]?.id ?? 0);
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(module.progress?.completedLessonIds ?? []),
  );

  const activeLesson =
    module.lessons.find((lesson) => lesson.id === activeId) ?? module.lessons[0];

  const percent = useMemo(
    () =>
      module.lessons.length > 0
        ? Math.round((completed.size / module.lessons.length) * 100)
        : 0,
    [completed, module.lessons.length],
  );

  function markComplete(lessonId: number) {
    if (!signedIn) return;
    setCompleted((current) => new Set(current).add(lessonId));

    void (async () => {
      try {
        const response = await fetch(
          `/api/learning/modules/${module.id}/lessons/${lessonId}/complete`,
          { method: "POST" },
        );
        if (!response.ok) throw new Error();
        toast.success("Lesson complete", {
          description: "Your progress has been saved.",
        });
      } catch {
        setCompleted((current) => {
          const next = new Set(current);
          next.delete(lessonId);
          return next;
        });
        toast.error("Couldn't save your progress", {
          description: "Sign in again and retry this lesson.",
        });
      }
    })();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-ink/[0.08] bg-white p-4">
          <div className="flex items-center justify-between text-[0.625rem] text-ink/45">
            <span>Course progress</span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className="h-full rounded-full bg-moss transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ol className="mt-4 space-y-1">
            {module.lessons.map((lesson, index) => {
              const isActive = lesson.id === activeLesson?.id;
              const isDone = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(lesson.id)}
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      isActive ? "bg-ink/[0.05]" : "hover:bg-ink/[0.03]"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-moss" strokeWidth={2} />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-ink/25" strokeWidth={2} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
                        Lesson {index + 1}
                      </span>
                      <span
                        className={`block text-[0.75rem] leading-[1.4] ${
                          isActive ? "font-semibold text-ink" : "text-ink/65"
                        }`}
                      >
                        {lesson.title}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {signedIn && completed.size >= module.lessons.length && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-moss/[0.07] px-2.5 py-2 text-[0.6875rem] font-medium text-moss">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Course completed
            </div>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {activeLesson ? (
          <article className="rounded-2xl border border-ink/[0.08] bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral" surface="light">
                Lesson {module.lessons.findIndex((item) => item.id === activeLesson.id) + 1}
              </Badge>
              {completed.has(activeLesson.id) && (
                <Badge tone="success" surface="light">
                  Completed
                </Badge>
              )}
            </div>

            <h2 className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2rem)] leading-[1.08] tracking-[-0.02em] text-ink">
              {activeLesson.title}
            </h2>

            {activeLesson.mediaUrl && (
              <div className="mt-4">
                {activeLesson.contentType === "video" ? (
                  <video
                    controls
                    src={activeLesson.mediaUrl}
                    className="w-full rounded-xl border border-ink/[0.08]"
                  >
                    <track kind="captions" />
                  </video>
                ) : activeLesson.contentType === "pdf" ? (
                  <a
                    href={activeLesson.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-ink/[0.08] bg-ink/[0.015] px-4 py-3 text-[0.8125rem] font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
                  >
                    <FileText className="h-4 w-4 text-clay" strokeWidth={1.9} />
                    Open lesson PDF
                  </a>
                ) : (
                  <a
                    href={activeLesson.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-ink/[0.08]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeLesson.mediaUrl}
                      alt={activeLesson.title}
                      className="max-h-72 w-full object-cover"
                    />
                  </a>
                )}
              </div>
            )}

            <div className="mt-4 whitespace-pre-line text-[0.875rem] leading-[1.75] text-ink/70">
              {activeLesson.contentBody || "This lesson has no written notes yet."}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] pt-4">
              <p className="text-[0.6875rem] text-ink/40">
                {activeLesson.durationMinutes
                  ? `${activeLesson.durationMinutes} minute read`
                  : "Self-paced"}
              </p>
              {signedIn ? (
                <Button
                  variant={completed.has(activeLesson.id) ? "secondary" : "primary"}
                  size="md"
                  disabled={completed.has(activeLesson.id)}
                  onClick={() => markComplete(activeLesson.id)}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {completed.has(activeLesson.id) ? "Completed" : "Mark as complete"}
                </Button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-ink px-3 text-[0.75rem] font-medium text-paper transition-colors hover:bg-moss"
                >
                  <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
                  Sign in to track progress
                </Link>
              )}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
