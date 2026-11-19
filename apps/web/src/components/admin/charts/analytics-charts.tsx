"use client";

import { useId, useState } from "react";

const GRID = "#e8eef6";
const AXIS = "#94a3b8";

export const CHART_COLORS = [
  "#2563eb",
  "#0f766e",
  "#c99a4e",
  "#b45309",
  "#64748b",
] as const;

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function FloatingTooltip({
  style,
  children,
}: {
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-[0.6875rem] shadow-lg"
      style={style}
    >
      {children}
    </div>
  );
}

function TooltipRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <span className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-1.5 text-ink/50">
        {color && (
          <span
            className="h-1.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </span>
      <span className="font-medium tabular-nums text-ink/75">{value}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Area chart                                                                  */
/* -------------------------------------------------------------------------- */

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
}

export interface AreaRow {
  label: string;
  fullLabel?: string;
  values: Record<string, number>;
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midX = (previous.x + current.x) / 2;
    d += ` C ${midX.toFixed(1)} ${previous.y.toFixed(1)} ${midX.toFixed(
      1,
    )} ${current.y.toFixed(1)} ${current.x.toFixed(1)} ${current.y.toFixed(1)}`;
  }
  return d;
}

export function AnalyticsAreaChart({
  series,
  data,
  height = 220,
  ariaLabel,
}: {
  series: AreaSeries[];
  data: AreaRow[];
  height?: number;
  ariaLabel: string;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [active, setActive] = useState<number | null>(null);

  const width = 720;
  const padX = 10;
  const padTop = 16;
  const padBottom = 28;
  const baseline = height - padBottom;

  const max = Math.max(
    1,
    ...data.flatMap((row) => series.map((item) => row.values[item.key] ?? 0)),
  );
  const x = (index: number) =>
    data.length > 1 ? padX + (index * (width - padX * 2)) / (data.length - 1) : width / 2;
  const y = (value: number) =>
    baseline - (value / max) * (baseline - padTop);

  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    if (data.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setActive(Math.min(data.length - 1, Math.max(0, index)));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
        onMouseMove={handleMove}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          {series.map((item) => (
            <linearGradient
              key={item.key}
              id={`${rawId}-${item.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padX}
            x2={width - padX}
            y1={y(max * tick)}
            y2={y(max * tick)}
            stroke={GRID}
            strokeDasharray={tick === 0 ? undefined : "3 4"}
          />
        ))}

        {series.map((item) => {
          const points = data.map((row, index) => ({
            x: x(index),
            y: y(row.values[item.key] ?? 0),
          }));
          const line = smoothPath(points);
          const area =
            points.length > 0
              ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(
                  1,
                )} ${baseline} Z`
              : "";
          return (
            <g key={item.key}>
              <path d={area} fill={`url(#${rawId}-${item.key})`} />
              <path
                d={line}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={padTop}
            y2={baseline}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {active !== null &&
          series.map((item) => (
            <circle
              key={item.key}
              cx={x(active)}
              cy={y(data[active].values[item.key] ?? 0)}
              r={3.5}
              fill="white"
              stroke={item.color}
              strokeWidth={2}
            />
          ))}

        {data.map((row, index) =>
          index % labelEvery === 0 ? (
            <text
              key={`${row.label}-${index}`}
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill={AXIS}
            >
              {row.label}
            </text>
          ) : null,
        )}
      </svg>

      {active !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-32 rounded-lg border border-ink/10 bg-white px-2.5 py-2 text-[0.6875rem] shadow-lg"
          style={{
            left: `clamp(0px, calc(${(x(active) / width) * 100}% - 60px), calc(100% - 120px))`,
          }}
        >
          <p className="font-medium text-ink/70">
            {data[active].fullLabel ?? data[active].label}
          </p>
          <ul className="mt-1 space-y-0.5">
            {series.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-ink/50">
                  <span
                    className="h-1.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="tabular-nums font-medium text-ink/75">
                  {data[active].values[item.key] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bar chart                                                                   */
/* -------------------------------------------------------------------------- */

export function AnalyticsBarChart({
  data,
  height = 200,
  color,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  ariaLabel: string;
}) {
  const width = 360;
  const padX = 8;
  const padTop = 22;
  const padBottom = 30;
  const baseline = height - padBottom;
  const max = Math.max(1, ...data.map((row) => row.value));
  const slot = (width - padX * 2) / Math.max(1, data.length);
  const barWidth = Math.min(46, slot * 0.55);

  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
      >
        {[0, 0.5, 1].map((tick) => (
          <line
            key={tick}
            x1={padX}
            x2={width - padX}
            y1={baseline - tick * (baseline - padTop)}
            y2={baseline - tick * (baseline - padTop)}
            stroke={GRID}
            strokeDasharray={tick === 0 ? undefined : "3 4"}
          />
        ))}

        {data.map((row, index) => {
          const barHeight = (row.value / max) * (baseline - padTop);
          const xCenter = padX + slot * index + slot / 2;
          const fill = color ?? colorAt(index);
          return (
            <g
              key={row.label}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              <rect
                x={padX + slot * index}
                y={padTop}
                width={slot}
                height={baseline - padTop}
                fill="transparent"
              />
              <rect
                x={xCenter - barWidth / 2}
                y={baseline - barHeight}
                width={barWidth}
                height={Math.max(barHeight, row.value > 0 ? 3 : 0)}
                rx={5}
                fill={fill}
                opacity={active === null || active === index ? 0.9 : 0.5}
                className="transition-opacity"
              />
              <text
                x={xCenter}
                y={baseline - barHeight - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="#475569"
              >
                {row.value}
              </text>
              <text
                x={xCenter}
                y={height - 10}
                textAnchor="middle"
                fontSize={10}
                fill={AXIS}
              >
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>

      {active !== null && (
        <FloatingTooltip
          style={{
            left: `${((padX + slot * active + slot / 2) / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -6px)",
          }}
        >
          <TooltipRow
            label={data[active].label}
            value={data[active].value}
            color={color ?? colorAt(active)}
          />
        </FloatingTooltip>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut chart                                                                 */
/* -------------------------------------------------------------------------- */

export function AnalyticsDonutChart({
  data,
  centerValue,
  centerLabel,
  size = 168,
  thickness = 22,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number }>;
  centerValue?: string | number;
  centerLabel?: string;
  size?: number;
  thickness?: number;
  ariaLabel: string;
}) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const [active, setActive] = useState<number | null>(null);
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {active !== null && (
          <FloatingTooltip
            style={{
              left: "50%",
              top: 0,
              transform: "translate(-50%, -100%)",
            }}
          >
            <TooltipRow
              label={data[active].label.replace(/_/g, " ")}
              value={`${data[active].value}${
                total > 0 ? ` · ${Math.round((data[active].value / total) * 100)}%` : ""
              }`}
              color={colorAt(active)}
            />
          </FloatingTooltip>
        )}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={ariaLabel}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={GRID}
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((row, index) => {
              const length = (row.value / total) * circumference;
              const dash = `${Math.max(length - 2, 0)} ${circumference}`;
              const current = offset;
              offset += length;
              return (
                <circle
                  key={row.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={colorAt(index)}
                  strokeWidth={active === index ? thickness + 4 : thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-current}
                  strokeLinecap="round"
                  opacity={active === null || active === index ? 1 : 0.45}
                  className="cursor-pointer transition-[stroke-width,opacity]"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[1.25rem] font-semibold leading-none tracking-[-0.02em] text-ink">
            {centerValue ?? total}
          </span>
          {centerLabel && (
            <span className="mt-1 text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((row, index) => (
          <li
            key={row.label}
            className={`flex items-center gap-2 rounded px-1 py-0.5 text-[0.6875rem] transition-colors ${
              active === index ? "bg-ink/[0.04]" : ""
            }`}
            title={`${row.label.replace(/_/g, " ")}: ${row.value}${
              total > 0 ? ` (${Math.round((row.value / total) * 100)}%)` : ""
            }`}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorAt(index) }}
            />
            <span className="min-w-0 flex-1 truncate capitalize text-ink/55">
              {row.label.replace(/_/g, " ")}
            </span>
            <span className="tabular-nums font-medium text-ink/75">{row.value}</span>
            <span className="w-9 text-right tabular-nums text-ink/35">
              {total > 0 ? Math.round((row.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
        {data.length === 0 && <li className="text-[0.6875rem] text-ink/40">No data</li>}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gauge chart                                                                 */
/* -------------------------------------------------------------------------- */

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy - radius * Math.sin(radians) };
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polar(cx, cy, radius, startAngle);
  const end = polar(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

export function AnalyticsGaugeChart({
  value,
  max = 100,
  label,
  caption,
  color = "#0f766e",
  size = 260,
}: {
  value: number;
  max?: number;
  label: string;
  caption?: string;
  color?: string;
  size?: number;
}) {
  const height = size / 2 + 28;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = size / 2 - 18;
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const endAngle = 180 - 180 * ratio;
  const percent = Math.round(ratio * 100);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      {hovered && (
        <FloatingTooltip
          style={{ left: "50%", top: 0, transform: "translate(-50%, -100%)" }}
        >
          <TooltipRow label={label} value={`${value} / ${max} · ${percent}%`} color={color} />
        </FloatingTooltip>
      )}
      <svg
        viewBox={`0 0 ${size} ${height}`}
        className="w-full max-w-[280px]"
        role="img"
        aria-label={`${label}: ${percent}%`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <path
          d={arcPath(cx, cy, radius, 180, 0)}
          fill="none"
          stroke={GRID}
          strokeWidth={18}
          strokeLinecap="round"
        />
        {ratio > 0 && (
          <path
            d={arcPath(cx, cy, radius, 180, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={18}
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={30}
          fontWeight={600}
          fill="#1e293b"
        >
          {percent}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill={AXIS}>
          {label}
        </text>
      </svg>
      {caption && (
        <p className="-mt-1 text-center text-[0.6875rem] text-ink/45">{caption}</p>
      )}
    </div>
  );
}
