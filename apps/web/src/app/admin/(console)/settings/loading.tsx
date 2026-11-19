export default function Loading() {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      <div className="h-3 w-14 animate-pulse rounded bg-ink/[0.05]" />
      <div className="mt-2 h-9 w-40 animate-pulse rounded-lg bg-ink/[0.07]" />
      <div className="mt-3 h-3 w-[min(60ch,80vw)] animate-pulse rounded bg-ink/[0.05]" />

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="hidden self-start rounded-xl border border-ink/[0.08] bg-white p-1.5 lg:block">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="mb-1 h-8 animate-pulse rounded-lg bg-ink/[0.05] last:mb-0"
            />
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-[104px] animate-pulse rounded-xl border border-ink/[0.06] bg-white"
              />
            ))}
          </div>

          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-ink/[0.08] bg-white"
            >
              <div className="border-b border-ink/[0.06] px-4 py-3">
                <div className="h-4 w-40 animate-pulse rounded bg-ink/[0.06]" />
                <div className="mt-2 h-2.5 w-64 animate-pulse rounded bg-ink/[0.04]" />
              </div>
              <div className="space-y-2.5 p-4">
                {Array.from({ length: 4 }, (_, row) => (
                  <div key={row} className="flex items-center justify-between gap-4">
                    <div className="h-3 w-28 animate-pulse rounded bg-ink/[0.05]" />
                    <div className="h-3 w-40 animate-pulse rounded bg-ink/[0.06]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
