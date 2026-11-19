"use client";

import type { LucideIcon } from "lucide-react";

export interface TabFilterOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Omit to hide the count pill. */
  count?: number;
}

interface TabFiltersProps<T extends string> {
  options: readonly TabFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Shared segmented tab filter: icon + label + optional count pill. The active
 * tab is filled with the ink surface, matching the admin console's tabs.
 */
export function TabFilters<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: TabFiltersProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-1 ${className}`}
    >
      {options.map(({ id, label, icon: Icon, count }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.75rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 ${
              active
                ? "bg-ink text-paper"
                : "text-ink/55 hover:bg-ink/[0.05] hover:text-ink"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />}
            {label}
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.625rem] tabular-nums ${
                  active ? "bg-paper/15 text-paper/80" : "bg-ink/[0.05] text-ink/45"
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
