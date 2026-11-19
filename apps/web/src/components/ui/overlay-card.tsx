"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface OverlayCardProps {
  onClose: () => void;
  /** id of the heading element that labels the dialog. */
  labelledBy: string;
  eyebrow?: string;
  title: ReactNode;
  /** Overrides the default monospace title styling. */
  titleClassName?: string;
  /** Badges or metadata shown beside the title. */
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
  closeLabel?: string;
  /** Hide the header close button (dismiss via backdrop or Escape). Defaults to true. */
  showClose?: boolean;
}

/**
 * Accessible overlay/dialog card: handles Escape, backdrop dismissal, body
 * scroll locking, and focus, while pages supply their own header and body.
 */
export function OverlayCard({
  onClose,
  labelledBy,
  eyebrow,
  title,
  titleClassName = "font-mono text-[0.9375rem] font-semibold tracking-wide text-ink",
  meta,
  children,
  footer,
  panelClassName = "",
  closeLabel = "Close",
  showClose = true,
}: OverlayCardProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus and scroll lock belong to opening the dialog, not to every parent
  // re-render. Re-running on a new `onClose` identity steals focus from inputs.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="dialog-overlay fixed inset-0 z-50 flex items-end justify-center bg-[#06182b]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`dialog-panel group flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_32px_80px_-32px_rgba(6,24,43,0.6)] sm:rounded-2xl ${panelClassName}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/[0.07] px-5 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-clay">
                {eyebrow}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h2
                id={labelledBy}
                className={titleClassName}
              >
                {title}
              </h2>
              {meta}
            </div>
          </div>
          {showClose && (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink/[0.08] text-ink/45 transition-colors hover:border-ink/20 hover:bg-ink/[0.03] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              <X className="h-4 w-4" strokeWidth={1.9} />
            </button>
          )}
        </div>

        {children}

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink/[0.07] bg-white px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
