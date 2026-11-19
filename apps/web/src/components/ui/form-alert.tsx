"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export type FormAlertVariant = "error" | "info" | "success";

const STYLES: Record<
  FormAlertVariant,
  { wrapper: string; icon: typeof AlertCircle }
> = {
  error: {
    wrapper: "border-[#e8b8ad] bg-[#fdf1ee] text-[#7d3a2b]",
    icon: AlertCircle,
  },
  info: {
    wrapper: "border-[#cbe3d1] bg-[#f1f8f3] text-[#2f5c42]",
    icon: Info,
  },
  success: {
    wrapper: "border-moss/25 bg-moss/[0.06] text-moss",
    icon: CheckCircle2,
  },
};

interface FormAlertProps {
  message?: string;
  variant?: FormAlertVariant;
  className?: string;
}

/** Friendly inline banner used for form errors and notices. */
export function FormAlert({
  message,
  variant = "error",
  className = "",
}: FormAlertProps) {
  if (!message) return null;

  const style = STYLES[variant];
  const Icon = style.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[0.8125rem] leading-[1.55] ${style.wrapper} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p>{message}</p>
    </div>
  );
}
