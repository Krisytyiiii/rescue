import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "light"
  | "pending"
  | "info"
  | "progress"
  | "success"
  | "warning"
  | "danger";

/** Glassy tones for dark/photo surfaces. */
const OVERLAY_TONES: Record<BadgeTone, string> = {
  neutral: "bg-white/10 text-white/80",
  light: "bg-white/15 text-white",
  pending: "bg-[#c99a4e]/15 text-[#e7c78c]",
  info: "bg-[#1f7a4d]/15 text-[#a7e3c0]",
  progress: "bg-[#247a54]/20 text-[#7dd3c0]",
  success: "bg-[#15803d]/20 text-[#86efac]",
  warning: "bg-[#b45309]/15 text-[#fcd34d]",
  danger: "bg-[#b42318]/15 text-[#fca5a5]",
};

/** Tinted tones for light surfaces. */
const LIGHT_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink/[0.07] text-ink/65",
  light: "bg-ink/[0.06] text-ink/70",
  pending: "bg-[#c99a4e]/22 text-[#7a5212]",
  info: "bg-[#1f7a4d]/12 text-[#16603b]",
  progress: "bg-[#247a54]/12 text-[#1c5f42]",
  success: "bg-[#15803d]/12 text-[#166534]",
  warning: "bg-[#b45309]/16 text-[#92400e]",
  danger: "bg-[#b42318]/14 text-[#991b1b]",
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Which surface the badge sits on. Photo overlays use "dark". */
  surface?: "dark" | "light";
  className?: string;
  children: ReactNode;
}

/** Small status/label pill that stays readable over photos and on white cards. */
export function Badge({
  tone = "neutral",
  surface = "dark",
  className = "",
  children,
}: BadgeProps) {
  const palette = surface === "light" ? LIGHT_TONES : OVERLAY_TONES;
  const ring = surface === "light" ? "ring-ink/[0.04]" : "ring-white/10";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold ring-1 ring-inset backdrop-blur-sm ${palette[tone]} ${ring} ${className}`}
    >
      {children}
    </span>
  );
}
