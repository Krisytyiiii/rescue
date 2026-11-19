"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  name: string;
  id?: string;
  /** Controlled value (`yyyy-mm-dd`). When provided, the field follows external changes. */
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  invalid?: boolean;
  /** Earliest selectable date (`yyyy-mm-dd`). Earlier days are disabled. */
  min?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Parses `yyyy-mm-dd` without the UTC shift of `new Date(value)`. */
function parseValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatValue(value: string): string {
  const date = parseValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function todayIso(): string {
  return toIso(new Date());
}

/**
 * Custom calendar popover used instead of the inconsistent native date input.
 * Submits through a hidden input so it works inside a plain form.
 */
export function DatePicker({
  name,
  id,
  value: controlledValue,
  defaultValue = "",
  placeholder = "Pick a date",
  onChange,
  className = "",
  invalid = false,
  min,
}: DatePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [cursor, setCursor] = useState(
    () =>
      parseValue(controlledValue ?? defaultValue) ??
      (min ? parseValue(min) : null) ??
      new Date(),
  );

  const value = controlledValue ?? internalValue;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const POPOVER_WIDTH = 272;
    const POPOVER_HEIGHT = 330;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - POPOVER_WIDTH - 8),
      );
      const openUp =
        rect.bottom + 6 + POPOVER_HEIGHT > window.innerHeight &&
        rect.top - 6 - POPOVER_HEIGHT > 0;
      setPosition({
        top: openUp ? rect.top - 6 - POPOVER_HEIGHT : rect.bottom + 6,
        left,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevious = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; current: boolean }> = [];
    for (let index = firstDay - 1; index >= 0; index -= 1) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevious - index),
        current: false,
      });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), current: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const last = cells[cells.length - 1]!.date;
      cells.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        current: false,
      });
      if (cells.length === 42) break;
    }
    return cells;
  }, [cursor]);

  const today = todayIso();
  const earliest = min ?? null;
  const earliestMonth = earliest ? earliest.slice(0, 7) : null;
  const cursorMonth = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const previousDisabled = earliestMonth !== null && cursorMonth <= earliestMonth;

  function commit(next: string) {
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />

      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        onClick={() => {
          setPosition(null);
          setOpen((current) => !current);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={`flex h-8 w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 text-left text-[0.75rem] outline-none transition-colors focus:border-clay focus:ring-2 focus:ring-clay/15 ${
          invalid ? "border-[#b42318]/60" : "border-ink/15"
        } ${value ? "text-ink" : "text-ink/35"}`}
      >
        <span className="truncate">{value ? formatValue(value) : placeholder}</span>
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-ink/35" strokeWidth={1.9} />
      </button>

      {open && position &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose a date"
            style={{ top: position.top, left: position.left }}
            className="dialog-panel fixed z-[95] w-[17rem] rounded-xl border border-ink/10 bg-white p-3 shadow-[0_18px_40px_-18px_rgba(6,24,43,0.45)]"
          >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.75rem] font-semibold text-ink">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                disabled={previousDisabled}
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
                  previousDisabled
                    ? "cursor-not-allowed text-ink/15"
                    : "text-ink/45 hover:bg-ink/[0.05] hover:text-ink"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="grid h-7 w-7 place-items-center rounded-md text-ink/45 transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="grid h-6 place-items-center text-[0.5625rem] font-semibold uppercase tracking-wide text-ink/35"
              >
                {weekday}
              </span>
            ))}
            {days.map(({ date, current }) => {
              const iso = toIso(date);
              const selected = iso === value;
              const isToday = iso === today;
              const beforeMin = earliest !== null && iso < earliest;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => commit(iso)}
                  disabled={beforeMin}
                  aria-pressed={selected}
                  aria-disabled={beforeMin || undefined}
                  className={`grid h-7 place-items-center rounded-md text-[0.6875rem] tabular-nums transition-colors ${
                    beforeMin
                      ? "cursor-not-allowed text-ink/15"
                      : selected
                        ? "bg-ink font-semibold text-paper"
                        : current
                          ? "text-ink/70 hover:bg-clay/10 hover:text-clay"
                          : "text-ink/25 hover:bg-ink/[0.04]"
                  } ${isToday && !selected && !beforeMin ? "ring-1 ring-inset ring-clay/40" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-ink/[0.06] pt-2">
            <button
              type="button"
              onClick={() => commit("")}
              className={`inline-flex items-center gap-1 text-[0.625rem] font-medium transition-colors ${
                value ? "text-ink/45 hover:text-ink" : "cursor-default text-ink/20"
              }`}
              disabled={!value}
            >
              <X className="h-3 w-3" strokeWidth={2} />
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const start =
                  earliest !== null && earliest > today ? parseValue(earliest)! : new Date();
                setCursor(start);
                commit(toIso(start));
              }}
              className="text-[0.625rem] font-semibold text-clay transition-colors hover:text-clay/80"
            >
              Today
            </button>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
