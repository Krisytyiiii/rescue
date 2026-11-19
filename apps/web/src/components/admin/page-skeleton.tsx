import type { ReactNode } from "react";

type SkeletonVariant = "table" | "grid" | "split" | "dashboard";

interface AdminPageSkeletonProps {
  /** Number of KPI cards the real page renders. Use 0 for none. */
  stats?: number;
  /** Body layout to mirror. */
  variant?: SkeletonVariant;
  /** Show the filter/tab bar under the heading. */
  filters?: boolean;
  /** Rows for the table variant. */
  rows?: number;
  /** Cards for the grid variant. */
  cards?: number;
  /** Accessible label, e.g. "Loading reports". */
  label?: string;
}

/**
 * Route-level loading shell shared by the admin pages.
 *
 * Keep each page's `loading.tsx` variant in sync with what the real page
 * renders: the number of KPI cards, the body layout, and the filter bar.
 */
export function AdminPageSkeleton({
  stats = 4,
  variant = "table",
  filters = true,
  rows = 8,
  cards = 6,
  label = "Loading page",
}: AdminPageSkeletonProps) {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <div className="h-9 w-56 animate-pulse rounded-lg bg-ink/[0.07]" />
          <div className="mt-3 h-3 w-[min(60ch,80vw)] animate-pulse rounded bg-ink/[0.05]" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-ink/[0.05]" />
      </div>

      {stats > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: stats }, (_, index) => (
            <div
              key={index}
              className="h-[104px] animate-pulse rounded-xl border border-ink/[0.06] bg-white"
            />
          ))}
        </div>
      )}

      {filters && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-ink/[0.07] bg-white p-3">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-ink/[0.05]" />
          <div className="h-8 w-44 animate-pulse rounded-lg bg-ink/[0.04]" />
          <div className="h-8 w-52 animate-pulse rounded-lg bg-ink/[0.04]" />
          <div className="ml-auto h-8 w-28 animate-pulse rounded-lg bg-ink/[0.04]" />
        </div>
      )}

      <div className="mt-4">{renderBody(variant, rows, cards)}</div>

      <span className="sr-only">{label}</span>
    </div>
  );
}

function renderBody(variant: SkeletonVariant, rows: number, cards: number): ReactNode {
  switch (variant) {
    case "grid":
      return (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }, (_, index) => (
            <li
              key={index}
              className="overflow-hidden rounded-xl border border-ink/[0.06] bg-white"
            >
              <div className="h-40 animate-pulse bg-ink/[0.06]" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-ink/[0.05]" />
                <div className="mt-4 h-8 w-full animate-pulse rounded-lg bg-ink/[0.05]" />
              </div>
            </li>
          ))}
        </ul>
      );

    case "split":
      return (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-xl border border-ink/[0.07] bg-white p-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-ink/[0.05] px-1 py-3 last:border-b-0"
              >
                <div className="h-9 w-9 animate-pulse rounded-lg bg-ink/[0.06]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-ink/[0.06]" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-ink/[0.04]" />
                </div>
              </div>
            ))}
          </div>
          <div className="min-h-[360px] rounded-xl border border-ink/[0.07] bg-white p-4">
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-ink/[0.05]" />
            <div className="mt-4 space-y-3">
              <div className="h-16 w-3/4 animate-pulse rounded-xl bg-ink/[0.04]" />
              <div className="ml-auto h-12 w-1/2 animate-pulse rounded-xl bg-ink/[0.04]" />
              <div className="h-20 w-2/3 animate-pulse rounded-xl bg-ink/[0.04]" />
            </div>
          </div>
        </div>
      );

    case "dashboard":
      return (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border border-ink/[0.06] bg-white" />
          <div className="h-64 animate-pulse rounded-xl border border-ink/[0.06] bg-white" />
        </div>
      );

    case "table":
    default:
      return (
        <div className="overflow-hidden rounded-xl border border-ink/[0.07] bg-white">
          <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3.5">
            <div className="h-4 w-32 animate-pulse rounded bg-ink/[0.06]" />
            <div className="h-3 w-40 animate-pulse rounded bg-ink/[0.04]" />
          </div>
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-ink/[0.05] px-4 py-3 last:border-b-0"
            >
              <div className="h-9 w-9 animate-pulse rounded-full bg-ink/[0.06]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-2.5 w-1/4 animate-pulse rounded bg-ink/[0.05]" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-full bg-ink/[0.06]" />
              <div className="h-4 w-14 animate-pulse rounded-full bg-ink/[0.05]" />
              <div className="h-7 w-20 animate-pulse rounded-lg bg-ink/[0.05]" />
            </div>
          ))}
        </div>
      );
  }
}
