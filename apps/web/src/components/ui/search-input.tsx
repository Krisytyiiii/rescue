"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  /** Current text. Pair with `onValueChange` for an instant, fetch-free filter. */
  value?: string;
  /** Fires on every keystroke so results can be filtered in memory. */
  onValueChange?: (value: string) => void;
  /** Initial text when used uncontrolled. */
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  /** Hide the leading magnifier for compact toolbars. */
  showIcon?: boolean;
  className?: string;
}

/**
 * Purely local search field. It never reads or writes the URL and never
 * fetches: every keystroke updates the caller's state synchronously, so the
 * caller can filter data it already has without stale responses.
 */
export function SearchInput({
  value,
  onValueChange,
  defaultValue = "",
  placeholder = "Search",
  label = "Search",
  showIcon = true,
  className = "",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internalValue;

  // Keep an uncontrolled field in sync with server-driven resets (e.g. a
  // "Clear filters" action) without clobbering active typing.
  useEffect(() => {
    if (!controlled && document.activeElement !== inputRef.current) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, controlled]);

  function change(next: string) {
    if (!controlled) setInternalValue(next);
    onValueChange?.(next);
  }

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      {showIcon && (
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink/35"
          strokeWidth={1.8}
        />
      )}
      <input
        ref={inputRef}
        type="search"
        value={current}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && current) {
            event.preventDefault();
            change("");
          }
        }}
        placeholder={placeholder}
        className={`h-8 w-full rounded-lg border border-ink/15 bg-white pr-8 text-[0.75rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-2 focus:ring-clay/15 ${
          showIcon ? "pl-8" : "pl-2.5"
        }`}
      />
      {current && (
        <button
          type="button"
          onClick={() => change("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-ink/35 transition-colors hover:bg-ink/[0.05] hover:text-ink/60"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
    </label>
  );
}
