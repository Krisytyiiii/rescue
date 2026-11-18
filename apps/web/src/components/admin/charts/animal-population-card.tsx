"use client";

import { useState } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const SIZE = 164;
const CENTER = SIZE / 2;
const RADIUS = 56;
const STROKE = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AnimalPopulationCard({
  segments,
  totalAnimals,
}: {
  segments: DonutSegment[];
  totalAnimals: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let offset = 0;
  const arcs = segments.map((segment) => {
    const length = total > 0 ? (segment.value / total) * CIRCUMFERENCE : 0;
    const arc = { ...segment, length, offset };
    offset += length;
    return arc;
  });

  const activeSegment = active !== null ? segments[active] : null;
  const activeShare = activeSegment && total > 0
    ? Math.round((activeSegment.value / total) * 100)
    : 0;

  return (
    <section className="flex flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="border-b border-ink/[0.07] px-4 py-3.5">
        <h2 className="text-[0.9375rem] font-semibold text-ink">Animal population</h2>
        <p className="mt-0.5 text-[0.75rem] text-ink/45">Dogs and cats on record</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-5">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-full w-full -rotate-90"
            role="img"
            aria-label={`Animal population by species, ${totalAnimals} total`}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#eef3f9"
              strokeWidth={STROKE}
            />

            {total === 0 ? (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="#dbe6f2"
                strokeWidth={STROKE}
                strokeDasharray="4 7"
              />
            ) : (
              arcs.map((arc, index) => {
                const isActive = active === index;
                const gap = arc.length > 6 ? 2 : 0;
                return (
                  <circle
                    key={arc.label}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={arc.color}
                    strokeWidth={isActive ? STROKE + 4 : STROKE}
                    strokeDasharray={`${Math.max(0, arc.length - gap)} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-arc.offset}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-[stroke-width] duration-150"
                    style={{ opacity: active === null || isActive ? 1 : 0.45 }}
                    onMouseEnter={() => setActive(index)}
                    onMouseLeave={() => setActive(null)}
                  />
                );
              })
            )}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[1.75rem] leading-none tracking-[-0.02em] text-ink">
              {activeSegment ? activeSegment.value : totalAnimals}
            </span>
            <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.1em] text-ink/40">
              {activeSegment ? `${activeShare}%` : "animals"}
            </span>
          </div>
        </div>

        <p className="mt-3 h-4 text-[0.75rem] font-medium text-ink/55">
          {activeSegment ? activeSegment.label : ""}
        </p>
      </div>

      <ul className="grid grid-cols-2 border-t border-ink/[0.07]">
        {segments.map((segment, index) => (
          <li key={segment.label} className="border-r border-ink/[0.07] last:border-r-0">
            <button
              type="button"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-ink/[0.02]"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-[0.75rem] text-ink/55">{segment.label}</span>
              <span className="ml-auto text-[0.75rem] font-semibold tabular-nums text-ink">
                {segment.value}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
