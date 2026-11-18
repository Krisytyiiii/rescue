"use client";

import { useMemo, useState } from "react";

export interface TrendPoint {
  label: string;
  fullLabel: string;
  value: number;
}

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

export function ReportsActivityCard({ data }: { data: TrendPoint[] }) {
  const [range, setRange] = useState<Range>(14);
  const [active, setActive] = useState<number | null>(null);

  const points = useMemo(() => data.slice(-range), [data, range]);

  const W = 720;
  const H = 220;
  const padX = 10;
  const padTop = 18;
  const padBottom = 34;

  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? (W - padX * 2) / (points.length - 1) : 0;
  const x = (index: number) => padX + index * step;
  const y = (value: number) => H - padBottom - (value / max) * (H - padBottom - padTop);

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.value).toFixed(1)}`)
    .join(" ");
  const area = points.length
    ? `${line} L ${x(points.length - 1).toFixed(1)} ${H - padBottom} L ${x(0).toFixed(1)} ${H - padBottom} Z`
    : "";

  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = points.reduce<TrendPoint | null>(
    (best, point) => (best === null || point.value > best.value ? point : best),
    null,
  );

  const labelEvery = range <= 7 ? 1 : range <= 14 ? 3 : 7;
  const activePoint = active !== null ? points[active] : null;

  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-ink">Reports activity</h2>
          <p className="mt-0.5 text-[0.75rem] text-ink/45">
            Community submissions over the last {range} days
          </p>
        </div>

        <div
          role="group"
          aria-label="Chart range"
          className="flex rounded-lg border border-ink/10 bg-ink/[0.02] p-0.5"
        >
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setRange(option);
                setActive(null);
              }}
              aria-pressed={range === option}
              className={`rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-colors ${
                range === option
                  ? "bg-ink text-paper shadow-sm"
                  : "text-ink/50 hover:text-ink"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[210px] w-full touch-none"
            role="img"
            aria-label={`Reports submitted per day over the last ${range} days`}
            onMouseLeave={() => setActive(null)}
            onMouseMove={(event) => {
              if (points.length === 0) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              const index = Math.round(ratio * (points.length - 1));
              setActive(Math.min(points.length - 1, Math.max(0, index)));
            }}
          >
            <defs>
              <linearGradient id="reports-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const gy = y(max * tick);
              return (
                <line
                  key={tick}
                  x1={padX}
                  x2={W - padX}
                  y1={gy}
                  y2={gy}
                  stroke="#e6edf5"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : "3 4"}
                />
              );
            })}

            {area && <path d={area} fill="url(#reports-area)" />}
            {line && (
              <path
                d={line}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {activePoint && active !== null && (
              <>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={padTop}
                  y2={H - padBottom}
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(active)}
                  cy={y(activePoint.value)}
                  r={4.5}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </>
            )}

            {points.map((point, index) =>
              index % labelEvery === 0 || index === points.length - 1 ? (
                <text
                  key={point.fullLabel}
                  x={x(index)}
                  y={H - 12}
                  textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                  fontSize={10}
                  fill="#94a3b8"
                >
                  {point.label}
                </text>
              ) : null,
            )}
          </svg>

          {total === 0 && (
            <p className="pointer-events-none absolute inset-x-0 top-[38%] text-center text-[0.75rem] font-medium text-ink/35">
              No reports submitted in this period
            </p>
          )}

          {activePoint && active !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-center shadow-lg"
              style={{
                left: `${(x(active) / W) * 100}%`,
                top: `${(y(activePoint.value) / H) * 100}%`,
              }}
            >
              <span className="block text-[0.625rem] font-medium uppercase tracking-[0.08em] text-paper/50">
                {activePoint.fullLabel}
              </span>
              <span className="block text-[0.8125rem] font-semibold text-paper">
                {activePoint.value} {activePoint.value === 1 ? "report" : "reports"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.07] px-4 py-2.5 text-[0.6875rem] text-ink/45">
        <span>
          <span className="font-semibold text-ink/70">{total}</span> submissions in range
        </span>
        <span>
          Busiest day:{" "}
          <span className="font-medium text-ink/65">
            {peak && peak.value > 0 ? peak.fullLabel : "—"}
          </span>
        </span>
      </div>
    </section>
  );
}
