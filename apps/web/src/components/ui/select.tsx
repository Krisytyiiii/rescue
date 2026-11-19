"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  id?: string;
  options: SelectOption[];
  placeholder?: string;
  /** Controlled value. When provided, the field follows external resets. */
  value?: string;
  defaultValue?: string;
  className?: string;
  size?: "default" | "compact";
  onChange?: (value: string) => void;
}

/**
 * Accessible custom listbox used instead of the native <select>, which cannot
 * be styled consistently across browsers. Submits through a hidden input so it
 * works with a plain <form>.
 */
export function Select({
  name,
  id,
  options,
  placeholder = "Select an option",
  value: controlledValue,
  defaultValue = "",
  className = "",
  size = "default",
  onChange,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const value = controlledValue ?? internalValue;
  const selected = options.find((option) => option.value === value);
  const showSearch = options.length > 8;
  const compact = size === "compact";

  const filtered = query.trim()
    ? options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(-1);
      return;
    }

    if (showSearch) searchRef.current?.focus();
    else listRef.current?.focus();
  }, [open, showSearch]);

  // Follow external resets ("Clear filters", tab switches) in controlled mode.
  useEffect(() => {
    if (controlledValue !== undefined) setInternalValue(controlledValue);
  }, [controlledValue]);

  function choose(option: SelectOption) {
    if (controlledValue === undefined) setInternalValue(option.value);
    setOpen(false);
    onChange?.(option.value);
  }

  function move(delta: number) {
    if (!filtered.length) return;
    setActiveIndex((current) => {
      const start = current < 0 ? (delta > 0 ? 0 : filtered.length - 1) : current;
      const next = current < 0 ? start : (start + delta + filtered.length) % filtered.length;
      return next;
    });
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      if (value) {
        const index = options.findIndex((option) => option.value === value);
        setActiveIndex(index);
      }
    }
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) choose(option);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />

      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={
          compact
            ? "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-ink/15 bg-white px-2.5 text-left text-[0.75rem] text-ink outline-none transition-colors focus:border-clay focus:ring-2 focus:ring-clay/15"
            : "mt-2 flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-ink/15 bg-white px-4 text-left text-[0.9375rem] text-ink outline-none transition-colors focus:border-clay focus:ring-4 focus:ring-clay/15"
        }
      >
        <span className={`min-w-0 truncate ${selected ? "text-ink" : "text-ink/35"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.7}
          className={`shrink-0 text-ink/45 transition-transform duration-200 ${
            compact ? "h-3 w-3" : "h-4 w-4"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-30 w-full border border-ink/15 bg-white shadow-[0_16px_40px_-12px_rgba(20,30,25,0.25)] ${
            compact ? "mt-1 rounded-lg p-1" : "mt-2 rounded-xl p-1.5"
          }`}
        >
          {showSearch && (
            <div className="relative mb-1">
              <Search
                aria-hidden="true"
                strokeWidth={1.7}
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleListKeyDown}
                placeholder="Search barangay"
                aria-label="Search options"
                className={`w-full rounded-lg border border-ink/10 bg-ink/[0.02] pl-9 pr-3 text-ink outline-none placeholder:text-ink/35 focus:border-clay focus:bg-white ${
                  compact ? "h-7 text-[0.75rem]" : "h-9 text-[0.8125rem]"
                }`}
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={selectId}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            className="max-h-60 overflow-y-auto outline-none"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-[0.8125rem] text-ink/45">
                No barangay matches “{query}”.
              </li>
            )}

            {filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg transition-colors ${
                    compact
                      ? "px-2 py-1 text-[0.75rem]"
                      : "px-3 py-2 text-[0.875rem]"
                  } ${isActive ? "bg-ink/[0.05] text-ink" : "text-ink/75"} ${
                    isSelected ? "font-medium text-ink" : ""
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5 shrink-0 text-clay" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
