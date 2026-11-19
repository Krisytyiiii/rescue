import type { ComponentProps } from "react";

interface TextareaProps extends ComponentProps<"textarea"> {}

/** Shared multiline input so forms share one border, focus, and sizing system. */
export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full resize-none rounded-lg border border-ink/12 bg-white px-2.5 py-2 text-[0.75rem] leading-[1.55] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay/50 focus:ring-2 focus:ring-clay/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
