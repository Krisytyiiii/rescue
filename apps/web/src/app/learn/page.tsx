import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, CheckCircle2, PawPrint } from "lucide-react";
import Link from "next/link";

import { authService, learningService } from "@furescue/core";

import { Badge } from "@/components/ui/badge";
import { readSession } from "@/lib/auth/session";
import {
  CATEGORY_META,
  formatMinutes,
} from "@/components/admin/learning/learning-types";

export const metadata: Metadata = {
  title: "Learn — responsible pet ownership | FuRescue",
  description:
    "Short courses on responsible pet ownership, dog and cat behavior, and basic training from FuRescue.",
};

export default async function LearnPage() {
  const session = await readSession();
  let userId: string | undefined;
  if (session) {
    const user = await authService.me(session.sub).catch(() => null);
    userId = user?.id;
  }

  const modules = await learningService.listPublishedModules(userId);

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
            href={userId ? "/admin" : "/login"}
            className="text-[0.75rem] font-medium text-ink/55 transition-colors hover:text-ink"
          >
            {userId ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-clay">
          Learn with FuRescue
        </p>
        <h1 className="mt-2 max-w-[24ch] font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] tracking-[-0.03em] text-ink">
          Responsible care starts with understanding.
        </h1>
        <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-[1.65] text-ink/60">
          Free, short courses on responsible pet ownership, dog and cat behavior,
          and basic training — written for adopters, fosters, and anyone who wants
          to care for animals well.
        </p>

        {modules.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-ink/30" strokeWidth={1.6} />
            <p className="mt-3 text-[0.875rem] font-semibold text-ink/70">
              Courses are being prepared
            </p>
            <p className="mt-1 text-[0.8125rem] text-ink/50">
              Check back soon for lessons on pet care, behavior, and training.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {modules.map((module) => (
              <CourseCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CourseCard({ module }: { module: Awaited<ReturnType<typeof learningService.listPublishedModules>>[number] }) {
  const meta = CATEGORY_META[module.category];
  const completed = module.progress?.completedLessonIds.length ?? 0;
  const percent =
    module.lessonCount > 0 ? Math.round((completed / module.lessonCount) * 100) : 0;

  return (
    <Link
      href={`/learn/${module.id}`}
      className="group flex flex-col rounded-2xl border border-ink/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,0.04)] transition-colors hover:border-ink/20"
    >
      {module.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={module.coverImageUrl}
          alt=""
          className="mb-4 h-36 w-full rounded-xl border border-ink/[0.06] object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <Badge tone={meta.tone} surface="light">
          {meta.label}
        </Badge>
        {module.progress?.completed ? (
          <span className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-moss">
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.2} />
            Completed
          </span>
        ) : (
          <ArrowUpRight
            className="h-4 w-4 text-ink/25 transition-colors group-hover:text-ink/50"
            strokeWidth={1.8}
          />
        )}
      </div>

      <h2 className="mt-3 font-display text-[1.25rem] leading-[1.15] tracking-[-0.02em] text-ink">
        {module.title}
      </h2>
      {module.description && (
        <p className="mt-1.5 line-clamp-3 text-[0.8125rem] leading-[1.55] text-ink/55">
          {module.description}
        </p>
      )}

      <p className="mt-3 text-[0.6875rem] text-ink/40">
        {module.lessonCount} {module.lessonCount === 1 ? "lesson" : "lessons"} ·{" "}
        {formatMinutes(module.totalMinutes)}
      </p>

      {module.progress && (
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-[0.625rem] text-ink/45">
            <span>
              {completed} of {module.lessonCount} lessons
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className="h-full rounded-full bg-moss"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
