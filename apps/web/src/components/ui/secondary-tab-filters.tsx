"use client";

export interface SecondaryTabOption<T extends string> {
  id: T;
  label: string;
  count?: number | string;
  /** Optional status dot color, e.g. "#c99a4e". Omit for no dot. */
  dot?: string;
}

interface SecondaryTabFiltersProps<T extends string> {
  options: readonly SecondaryTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  /** Wrap onto multiple lines instead of scrolling horizontally. */
  wrap?: boolean;
}

/**
 * Secondary status filter bar: a quieter, single-line row of status tabs with
 * an optional color dot and count. The active tab gets a faint ink wash.
 *
 * Use `TabFilters` for the primary section tabs; use this for status filters.
 */
export function SecondaryTabFilters<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  wrap = false,
}: SecondaryTabFiltersProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex min-w-0 items-center gap-1 ${
        wrap ? "flex-wrap" : "overflow-x-auto"
      } ${className}`}
    >
      {options.map(({ id, label, count, dot }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`inline-flex h-auto shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[0.8125rem] font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 ${
              active
                ? "bg-ink/[0.055] text-ink hover:bg-ink/[0.055]"
                : "text-ink/50 hover:bg-ink/[0.03] hover:text-ink/80"
            }`}
          >
            {dot && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: dot }}
              />
            )}
            {label}
            {count !== undefined && (
              <span
                className={`font-mono text-[0.6875rem] tabular-nums ${
                  active ? "text-ink/55" : "text-ink/35"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
