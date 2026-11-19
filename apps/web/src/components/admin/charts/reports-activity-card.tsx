"use client";

import { useMemo, useState } from "react";

import { AnalyticsAreaChart } from "@/components/admin/charts/analytics-charts";

export interface TrendPoint {
  label: string;
  fullLabel: string;
  reports: number;
  adoptions: number;
}

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const SERIES = [
  { key: "reports", label: "Reports", color: "#1f7a4d" },
  { key: "adoptions", label: "Adoptions", color: "#c99a4e" },
];

export function ReportsActivityCard({ data }: { data: TrendPoint[] }) {
  const [range, setRange] = useState<Range>(14);

  const points = useMemo(() => data.slice(-range), [data, range]);

  const totalReports = points.reduce((sum, point) => sum + point.reports, 0);
  const totalAdoptions = points.reduce((sum, point) => sum + point.adoptions, 0);
  const peak = points.reduce<TrendPoint | null>(
    (best, point) => (best === null || point.reports > best.reports ? point : best),
    null,
  );

  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-ink">Reports activity</h2>
          <p className="mt-0.5 text-[0.75rem] text-ink/45">
            Reports and adoptions over the last {range} days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[0.625rem] text-ink/45">
            {SERIES.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-1.5 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
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
                onClick={() => setRange(option)}
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
      </div>

      <div className="px-4 pt-4">
        <AnalyticsAreaChart
          ariaLabel={`Reports and adoptions per day over the last ${range} days`}
          series={SERIES}
          data={points.map((point) => ({
            label: point.label,
            fullLabel: point.fullLabel,
            values: { reports: point.reports, adoptions: point.adoptions },
          }))}
          height={210}
        />
      </div>

      <p className="mx-4 mt-3 border-t border-ink/[0.06] pt-2 text-[0.6875rem] leading-[1.5] text-ink/45">
        Compare the two lines each day. When reports run above adoptions, incoming
        cases are outpacing placements.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.07] px-4 py-2.5 text-[0.6875rem] text-ink/45">
        <span>
          <span className="font-semibold text-ink/70">{totalReports}</span> reports
          {" · "}
          <span className="font-semibold text-ink/70">{totalAdoptions}</span> adoptions
          in range
        </span>
        <span>
          Busiest day:{" "}
          <span className="font-medium text-ink/65">
            {peak && peak.reports > 0 ? peak.fullLabel : "—"}
          </span>
        </span>
      </div>
    </section>
  );
}
