import type { ComponentProps } from "react";

export type ButtonVariant =
  | "primary"
  | "inverted"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost";

export type ButtonSize = "xs" | "sm" | "md" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-moss",
  inverted: "bg-ink text-paper hover:bg-ink/90",
  secondary:
    "border border-ink/12 bg-white text-ink/60 hover:border-ink/25 hover:text-ink",
  ghost: "text-ink/55 hover:bg-ink/[0.04] hover:text-ink",
  danger: "bg-[#b42318] text-white hover:bg-[#991b1b]",
  dangerGhost: "text-[#991b1b] hover:bg-[#b42318]/10",
};

const SIZES: Record<ButtonSize, string> = {
  xs: "h-6 gap-1 px-1.5 text-[0.5625rem]",
  sm: "h-7 gap-1 px-2 text-[0.625rem]",
  md: "h-8 gap-1.5 px-3 text-[0.75rem]",
  icon: "h-7 w-7 p-0",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Shared button shell so actions share one focus, spacing, and tone system. */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
