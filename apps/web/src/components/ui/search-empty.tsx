"use client";

import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

interface SearchEmptyProps {
  /** Headline, e.g. "No animals match your search". */
  title?: string;
  /** One short sentence explaining what to try next. */
  description?: string;
  icon?: LucideIcon;
  /** Shows a clear button when provided. */
  onClear?: () => void;
  clearLabel?: string;
  /** Tighter spacing for side panels and compact lists. */
  compact?: boolean;
  className?: string;
}

/**
 * Shared "no results" state for any list filtered by the search bar. Keeps the
 * icon, copy, and clear action consistent across admin pages.
 */
export function SearchEmpty({
  title = "No matches found",
  description = "Try a different search or clear your filters.",
  icon: Icon = SearchX,
  onClear,
  clearLabel = "Clear search",
  compact = false,
  className = "",
}: SearchEmptyProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-10" : "px-6 py-14"
      } ${className}`}
    >
      <span
        className={`grid place-items-center rounded-full bg-ink/[0.045] text-ink/40 ${
          compact ? "h-9 w-9" : "h-11 w-11"
        }`}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.8} />
      </span>
      <p
        className={`mt-2.5 font-medium text-ink ${
          compact ? "text-[0.8125rem]" : "text-[0.9375rem]"
        }`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`mt-1 max-w-[40ch] leading-[1.55] text-ink/55 ${
            compact ? "text-[0.6875rem]" : "text-[0.8125rem]"
          }`}
        >
          {description}
        </p>
      )}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3.5 inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
