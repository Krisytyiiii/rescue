import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

export type StatTone = "clay" | "amber" | "moss" | "forest";

const TONES: Record<
  StatTone,
  { icon: string; ring: string; wash: string }
> = {
  clay: {
    icon: "text-clay",
    ring: "group-hover:border-clay/25",
    wash: "group-hover:bg-clay/[0.03]",
  },
  amber: {
    icon: "text-[#a87a34]",
    ring: "group-hover:border-[#c99a4e]/30",
    wash: "group-hover:bg-[#c99a4e]/[0.04]",
  },
  moss: {
    icon: "text-moss",
    ring: "group-hover:border-moss/25",
    wash: "group-hover:bg-moss/[0.03]",
  },
  forest: {
    icon: "text-forest",
    ring: "group-hover:border-forest/25",
    wash: "group-hover:bg-forest/[0.03]",
  },
};

interface StatCardProps {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone?: StatTone;
  href?: string;
}

/**
 * Compact metric tile for the admin dashboard.
 * Neutral surface by default; tone is applied only on interaction.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "clay",
  href,
}: StatCardProps) {
  const style = TONES[tone];

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/40 transition-colors group-hover:text-ink/55">
          {label}
        </p>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border border-ink/[0.07] bg-ink/[0.02] transition-colors group-hover:bg-white ${style.icon} ${style.ring}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[2rem] leading-none tracking-[-0.02em] text-ink tabular-nums">
            {value}
          </p>
          <p className="mt-1.5 truncate text-[0.75rem] leading-tight text-ink/45">{hint}</p>
        </div>

        {href && (
          <span className="mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink/[0.07] text-ink/25 transition-all duration-200 group-hover:border-current group-hover:bg-white group-hover:text-ink/60">
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        )}
      </div>
    </>
  );

  const className = `group relative block overflow-hidden rounded-xl border border-ink/[0.08] bg-white p-4 transition-all duration-200 ${style.wash}`;

  return href ? (
    <Link
      href={href}
      className={`${className} cursor-pointer hover:-translate-y-px hover:shadow-[0_10px_24px_-16px_rgba(16,36,26,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2 active:translate-y-0`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
