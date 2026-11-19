import type { ReactNode } from "react";

/** Shared tooltip surface so map overlays match the rest of the UI. */
export const TOOLTIP_BUBBLE = "rounded-lg bg-ink px-2.5 py-1.5 text-center shadow-lg";

export function Tooltip({
  content,
  children,
  align = "center",
}: {
  content: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  const alignment =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group/tooltip relative block">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-20 mb-1.5 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${TOOLTIP_BUBBLE} ${alignment}`}
      >
        {content}
      </span>
    </span>
  );
}
