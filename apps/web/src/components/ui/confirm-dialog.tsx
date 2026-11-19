"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ConfirmTone = "default" | "danger" | "success";

const TONES: Record<
  ConfirmTone,
  { icon: LucideIcon; badge: string; button: string }
> = {
  default: {
    icon: Info,
    badge: "bg-ink/[0.06] text-ink/60",
    button: "bg-ink text-paper hover:bg-moss",
  },
  success: {
    icon: CheckCircle2,
    badge: "bg-moss/10 text-moss",
    button: "bg-ink text-paper hover:bg-moss",
  },
  danger: {
    icon: AlertTriangle,
    badge: "bg-[#b42318]/10 text-[#b42318]",
    button: "bg-[#b42318] text-white hover:bg-[#991b1b]",
  },
};

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

/**
 * Confirmation overlay for state-changing actions. The caller closes it
 * immediately on confirm and applies an optimistic UI update; the network
 * request continues in the background.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  confirmDisabled = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const style = TONES[tone];
  const Icon = style.icon;

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChangeRef.current(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="dialog-overlay fixed inset-0 z-[90] flex items-center justify-center bg-[#06182b]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        className="dialog-panel w-full max-w-md overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_28px_70px_-28px_rgba(6,24,43,0.55)]"
      >
        <div className="flex items-start gap-3.5 p-5">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.badge}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-[0.9375rem] font-semibold leading-tight text-ink"
            >
              {title}
            </h2>
            {description && (
              <div
                id="confirm-dialog-description"
                className="mt-1.5 text-[0.8125rem] leading-[1.55] text-ink/55"
              >
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cancel"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/35 transition-colors hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
          >
            <X className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>

        {children && <div className="px-5 pb-1">{children}</div>}

        <div className="flex items-center justify-end gap-2 border-t border-ink/[0.07] bg-ink/[0.012] px-5 py-3.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center rounded-lg border border-ink/12 px-3.5 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`inline-flex h-9 items-center rounded-lg px-3.5 text-[0.75rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:cursor-not-allowed disabled:opacity-50 ${style.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
