export function ReportsResultsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 px-4 pb-1 pt-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
        <span className="h-3 w-36 animate-pulse rounded bg-ink/[0.07]" />
      </div>

      <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            className="overflow-hidden rounded-xl border border-ink/[0.06] bg-white"
          >
            <div className="h-64 animate-pulse bg-ink/[0.06]" />
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-ink/[0.06]" />
              </div>
              <div className="mt-4 h-8 w-full animate-pulse rounded-lg bg-ink/[0.05]" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading reports…</span>
    </div>
  );
}
