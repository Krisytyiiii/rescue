import type { ReactNode } from "react";

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scroll container with a custom thin scrollbar. The thumb stays hidden until
 * the nearest ancestor with the `group` class is hovered or focused within, so
 * overlays stay clean until the user interacts with them.
 */
export function ScrollArea({ children, className = "" }: ScrollAreaProps) {
  return (
    <div className={`scrollbar-on-hover overflow-y-auto overscroll-contain ${className}`}>
      {children}
    </div>
  );
}
