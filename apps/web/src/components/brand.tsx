export function PawMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="FuRescue paw mark"
    >
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <g fill="var(--paper)">
        <ellipse cx="23" cy="23" rx="4.6" ry="5.8" transform="rotate(-18 23 23)" />
        <ellipse cx="32" cy="19.5" rx="4.6" ry="5.8" />
        <ellipse cx="41" cy="23" rx="4.6" ry="5.8" transform="rotate(18 41 23)" />
        <path d="M32 29c7.2 0 13 5.1 13 11.2 0 4.4-3.2 7.3-7.3 7.3-2.2 0-4.1-.9-5.7-2-1.6 1.1-3.5 2-5.7 2C22.2 47.5 19 44.6 19 40.2 19 34.1 24.8 29 32 29Z" />
      </g>
    </svg>
  );
}

export function Wordmark({
  className = "",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-baseline gap-[2px] leading-none ${className}`}
    >
      <span className="font-sans text-[1.28rem] font-semibold tracking-[-0.055em]">
        Fu
      </span>
      <span
        className={`font-display-italic text-[1.55rem] leading-none tracking-[-0.02em] ${
          inverted ? "text-paper" : "text-ink"
        }`}
      >
        Rescue
      </span>
    </span>
  );
}
