"use client";

import { Clock, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
  name: string;
  id?: string;
  /** Controlled value in 24-hour `HH:mm`. When provided, the field follows external changes. */
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  invalid?: boolean;
  /** Minute increment shown in the picker. Defaults to 5. */
  minuteStep?: number;
  /** Earliest selectable time (`HH:mm`). Earlier times are disabled. */
  min?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

function parseValue(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

function formatValue(value: string): string {
  const parsed = parseValue(value);
  if (!parsed) return "";
  const hour12 = parsed.hours % 12 || 12;
  const period = parsed.hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

/**
 * Custom clock popover used instead of the inconsistent native time input.
 * Submits through a hidden input so it works inside a plain form.
 */
export function TimePicker({
  name,
  id,
  value: controlledValue,
  defaultValue = "",
  placeholder = "Pick a time",
  onChange,
  className = "",
  invalid = false,
  minuteStep = 5,
  min,
}: TimePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const value = controlledValue ?? internalValue;
  const parsed = parseValue(value);
  const period: "AM" | "PM" = parsed && parsed.hours >= 12 ? "PM" : "AM";
  const hour12 = parsed ? parsed.hours % 12 || 12 : null;
  const minutes = parsed ? parsed.minutes : null;

  const minuteOptions: number[] = [];
  for (let minute = 0; minute < 60; minute += minuteStep) minuteOptions.push(minute);

  const minParsed = min ? parseValue(min) : null;
  const minMinutes = minParsed ? minParsed.hours * 60 + minParsed.minutes : null;

  function to24Hour(hour: number, nextPeriod: "AM" | "PM"): number {
    let hours = hour % 12;
    if (nextPeriod === "PM") hours += 12;
    return hours;
  }

  function isPeriodDisabled(option: "AM" | "PM"): boolean {
    if (minMinutes === null) return false;
    return (
      to24Hour(activeHour, option) * 60 + (minutes ?? 0) < minMinutes
    );
  }

  function isHourDisabled(hour: number): boolean {
    if (minMinutes === null) return false;
    // Keep the hour selectable while any minute in it is still valid.
    return to24Hour(hour, period) * 60 + 59 < minMinutes;
  }

  function isMinuteDisabled(minute: number): boolean {
    if (minMinutes === null) return false;
    return to24Hour(activeHour, period) * 60 + minute < minMinutes;
  }

  /** Keeps the current minute when valid, otherwise snaps it forward to the minimum. */
  function minuteForHour(hour: number, nextPeriod: "AM" | "PM", minute: number): number {
    if (minMinutes === null) return minute;
    const base = to24Hour(hour, nextPeriod) * 60;
    return base + minute < minMinutes ? Math.max(0, minMinutes - base) : minute;
  }

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

    const POPOVER_WIDTH = 240;
    const POPOVER_HEIGHT = 360;

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

  function commit(next: string) {
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
  }

  function update(nextHour12: number, nextMinutes: number, nextPeriod: "AM" | "PM") {
    let hours = nextHour12 % 12;
    if (nextPeriod === "PM") hours += 12;
    commit(`${String(hours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`);
  }

  const activeHour = hour12 ?? 9;
  const activeMinutes = minutes ?? 0;

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
        <Clock className="h-3.5 w-3.5 shrink-0 text-ink/35" strokeWidth={1.9} />
      </button>

      {open && position &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose a time"
            style={{ top: position.top, left: position.left }}
            className="dialog-panel fixed z-[95] max-h-[min(20rem,calc(100dvh-1rem))] w-[min(15rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-ink/10 bg-white p-3 shadow-[0_18px_40px_-18px_rgba(6,32,20,0.45)]"
          >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.75rem] font-semibold text-ink">
              {formatValue(value) || placeholder}
            </p>
            <div className="flex items-center gap-1 rounded-md border border-ink/10 p-0.5">
              {(["AM", "PM"] as const).map((option) => {
                const disabled = isPeriodDisabled(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      update(
                        activeHour,
                        minuteForHour(activeHour, option, activeMinutes),
                        option,
                      )
                    }
                    disabled={disabled}
                    aria-pressed={period === option}
                    className={`h-6 rounded px-2 text-[0.625rem] font-semibold transition-colors ${
                      disabled
                        ? "cursor-not-allowed text-ink/15"
                        : period === option
                          ? "bg-ink text-paper"
                          : "text-ink/45 hover:bg-ink/[0.05] hover:text-ink"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
            Hour
          </p>
          <div className="mt-1 grid grid-cols-6 gap-0.5">
            {HOURS.map((hour) => {
              const selected = hour12 === hour;
              const disabled = isHourDisabled(hour);
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => update(hour, minuteForHour(hour, period, activeMinutes), period)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`grid h-7 place-items-center rounded-md text-[0.6875rem] tabular-nums transition-colors ${
                    disabled
                      ? "cursor-not-allowed text-ink/15"
                      : selected
                        ? "bg-ink font-semibold text-paper"
                        : "text-ink/70 hover:bg-clay/10 hover:text-clay"
                  }`}
                >
                  {hour}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
            Minute
          </p>
          <div className="mt-1 grid grid-cols-6 gap-0.5">
            {minuteOptions.map((minute) => {
              const selected = minutes === minute;
              const disabled = isMinuteDisabled(minute);
              return (
                <button
                  key={minute}
                  type="button"
                  onClick={() => update(activeHour, minute, period)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`grid h-7 place-items-center rounded-md text-[0.6875rem] tabular-nums transition-colors ${
                    disabled
                      ? "cursor-not-allowed text-ink/15"
                      : selected
                        ? "bg-ink font-semibold text-paper"
                        : "text-ink/70 hover:bg-clay/10 hover:text-clay"
                  }`}
                >
                  {String(minute).padStart(2, "0")}
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
                if (
                  minMinutes !== null &&
                  to24Hour(activeHour, period) * 60 + activeMinutes < minMinutes
                ) {
                  commit(min!);
                } else {
                  update(activeHour, activeMinutes, period);
                }
                setOpen(false);
              }}
              className="text-[0.625rem] font-semibold text-clay transition-colors hover:text-clay/80"
            >
              Done
            </button>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
