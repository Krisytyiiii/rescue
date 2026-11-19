"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  /** Page the query is written to, e.g. `/admin/reports`. */
  basePath?: string;
  /** Search param key. Defaults to `q`. */
  param?: string;
  defaultValue?: string;
  /** Controlled value. Pair with `onValueChange` to filter local state instead of the URL. */
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Debounce before the URL updates. Kept short so results feel instant. */
  delay?: number;
  /** Hide the leading magnifier for compact toolbars. */
  showIcon?: boolean;
  className?: string;
}

/**
 * URL-driven search field. Each keystroke cancels the previous pending
 * navigation, so rapid typing never stacks stale requests; the current page
 * can key its results on the URL to replace stale rows with a skeleton.
 */
export function SearchInput({
  basePath = "",
  param = "q",
  defaultValue = "",
  value,
  onValueChange,
  placeholder = "Search",
  label = "Search",
  delay = 200,
  showIcon = true,
  className = "",
}: SearchInputProps) {
  const router = useRouter();
  const timer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined && onValueChange !== undefined;
  const current = controlled ? value : internalValue;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // Keep in sync with server-driven resets (e.g. "Clear filters") without
  // clobbering what the user is actively typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setInternalValue(defaultValue);
  }, [defaultValue]);

  function commit(next: string) {
    const params = new URLSearchParams(window.location.search);
    const trimmed = next.trim();
    if (trimmed) params.set(param, trimmed);
    else params.delete(param);
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }

  function schedule(next: string) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      commit(next);
    }, delay);
  }

  function flush() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    commit(current);
  }

  function change(next: string) {
    setInternalValue(next);
    if (controlled) onValueChange(next);
    else schedule(next);
  }

  function clear() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setInternalValue("");
    if (controlled) onValueChange("");
    else commit("");
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
        name={param}
        value={current}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !controlled) flush();
          if (event.key === "Escape" && current) {
            event.preventDefault();
            clear();
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
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-ink/35 transition-colors hover:bg-ink/[0.05] hover:text-ink/60"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      )}
    </label>
  );
}
