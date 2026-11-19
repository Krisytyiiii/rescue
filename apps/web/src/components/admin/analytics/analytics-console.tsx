"use client";

import {
  Clock,
  Download,
  FileText,
  FileWarning,
  HeartHandshake,
  MapPin,
  Siren,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { StatCard, type StatTone } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";

import {
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsGaugeChart,
} from "@/components/admin/charts/analytics-charts";

import type {
  AnalyticsDashboardDto,
  AnalyticsDelta,
  AnalyticsRange,
  AnalyticsSlice,
  AnalyticsSpeciesFilter,
} from "@furescue/core";

const RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
  { value: "all", label: "All" },
];

const SPECIES_OPTIONS: Array<{ value: AnalyticsSpeciesFilter; label: string }> = [
  { value: "all", label: "All species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "unknown", label: "Unknown" },
];

type ExportTab = "adoptions" | "rescues" | "geography";

/** Converts cumulative funnel counts into exclusive stage counts for a donut. */
function stageMix(slices: AnalyticsSlice[]): AnalyticsSlice[] {
  return slices
    .map((slice, index) => ({
      label: slice.label,
      value: Math.max(slice.value - (slices[index + 1]?.value ?? 0), 0),
    }))
    .filter((slice) => slice.value > 0);
}

function formatHours(value: number): string {
  if (value <= 0) return "0h";
  if (value < 1) return `${Math.round(value * 60)}m`;
  if (value < 24) return `${value.toFixed(1)}h`;
  return `${(value / 24).toFixed(1)}d`;
}

function formatDelta(delta: AnalyticsDelta): string {
  if (delta.previous === 0 && delta.current === 0) return "No change vs previous period";
  const sign = delta.change > 0 ? "+" : "";
  return `${sign}${delta.change} vs previous period`;
}

function deltaTone(delta: AnalyticsDelta): "up" | "down" | "flat" {
  if (delta.change > 0) return "up";
  if (delta.change < 0) return "down";
  return "flat";
}

export function AnalyticsConsole({ data }: { data: AnalyticsDashboardDto }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [reportKind, setReportKind] = useState("adoption_trends");
  const [reportFormat, setReportFormat] = useState("csv");
  const [page, setPage] = useState(1);

  function applyFilters(patch: {
    range?: AnalyticsRange;
    barangayId?: number | null;
    species?: AnalyticsSpeciesFilter;
  }) {
    const params = new URLSearchParams();
    const range = patch.range ?? data.filters.range;
    const species = patch.species ?? data.filters.species;
    const barangay =
      patch.barangayId === undefined ? data.filters.barangayId : patch.barangayId;
    if (range !== "30d") params.set("range", range);
    if (species !== "all") params.set("species", species);
    if (barangay) params.set("barangay", String(barangay));
    startTransition(() => {
      router.push(`/admin/analytics${params.size ? `?${params.toString()}` : ""}`);
    });
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/analytics/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: reportKind,
          format: reportFormat,
          from: data.filters.from,
          to: data.filters.to,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error();
      toast.success("Report generated", {
        description: "It is now listed in Generated reports.",
      });
      startTransition(() => router.refresh());
    } catch {
      toast.error("Couldn't generate this report", {
        description: "Nothing was saved. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.4rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Analytics
          </h1>
          <p className="mt-1 max-w-[68ch] text-[0.8125rem] leading-[1.6] text-ink/55">
            Descriptive reporting on adoption trends, rescue efficiency, and the
            geographic distribution of cases.
          </p>
        </div>
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/55">
          <Clock className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          {pending ? "Updating…" : "Live from operations data"}
        </span>
      </div>

      <section className="rounded-xl border border-ink/[0.08] bg-white p-3 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex rounded-lg border border-ink/10 bg-ink/[0.02] p-0.5"
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => applyFilters({ range: option.value })}
                aria-pressed={data.filters.range === option.value}
                className={`rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-colors ${
                  data.filters.range === option.value
                    ? "bg-ink text-paper shadow-sm"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Select
            name="barangay"
            value={data.filters.barangayId ? String(data.filters.barangayId) : ""}
            onChange={(value) =>
              applyFilters({ barangayId: value ? Number(value) : null })
            }
            options={data.barangays.map((barangay) => ({
              value: String(barangay.id),
              label: barangay.name,
            }))}
            placeholder="All barangays"
            size="compact"
            className="w-44"
          />

          <Select
            name="species"
            value={data.filters.species}
            onChange={(value) => applyFilters({ species: value as AnalyticsSpeciesFilter })}
            options={SPECIES_OPTIONS}
            size="compact"
            className="w-36"
          />

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 pr-1 text-[0.6875rem] font-medium text-ink/40">
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              Export
            </span>
            {(
              [
                { tab: "adoptions", label: "Adoptions" },
                { tab: "rescues", label: "Rescues" },
                { tab: "geography", label: "Geography" },
              ] as Array<{ tab: ExportTab; label: string }>
            ).map((option) => (
              <a
                key={option.tab}
                href={`/api/admin/analytics/export?tab=${option.tab}&range=${
                  data.filters.range
                }${data.filters.barangayId ? `&barangay=${data.filters.barangayId}` : ""}${
                  data.filters.species !== "all" ? `&species=${data.filters.species}` : ""
                }`}
                className="inline-flex h-8 items-center rounded-lg border border-ink/12 bg-white px-2.5 text-[0.6875rem] font-medium text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Reports received"
          value={data.overview.reportsReceived}
          delta={data.overview.deltas.reportsReceived}
          icon={FileWarning}
          tone="clay"
          betterWhenDown={false}
        />
        <KpiCard
          label="Rescue success"
          value={`${data.overview.rescueSuccessRate}%`}
          delta={data.overview.deltas.rescueSuccessRate}
          icon={Siren}
          tone="moss"
          betterWhenDown={false}
        />
        <KpiCard
          label="Animals adopted"
          value={data.overview.animalsAdopted}
          delta={data.overview.deltas.animalsAdopted}
          icon={HeartHandshake}
          tone="forest"
          betterWhenDown={false}
        />
        <KpiCard
          label="Median adoption"
          value={
            data.overview.medianAdoptionDays > 0
              ? `${data.overview.medianAdoptionDays}d`
              : "—"
          }
          delta={data.overview.deltas.medianAdoptionDays}
          icon={TrendingUp}
          tone="amber"
          betterWhenDown
        />
        <KpiCard
          label="Avg response"
          value={formatHours(data.overview.avgResponseHours)}
          delta={data.overview.deltas.avgResponseHours}
          icon={Clock}
          tone="clay"
          betterWhenDown
        />
        <KpiCard
          label="Active barangays"
          value={data.overview.activeBarangays}
          delta={data.overview.deltas.activeBarangays}
          icon={MapPin}
          tone="moss"
          betterWhenDown={false}
        />
      </div>

      <SectionHeading
        title="Overview"
        caption="Reports and adoptions at a glance for the selected range"
      />
      <OverviewTab data={data} />

      <SectionHeading
        title="Adoption trends"
        caption="Applications, approvals, rejections, and time to adoption"
      />
      <AdoptionsTab data={data} />

      <SectionHeading
        title="Rescue efficiency"
        caption="Pipeline, stage durations, throughput, and rescuer workload"
      />
      <RescuesTab data={data} />

      <SectionHeading
        title="Geographic distribution"
        caption="Case volume, outcomes, and coverage by barangay"
      />
      <GeographyTab data={data} page={page} onPageChange={setPage} />

      <SectionHeading
        title="Generated reports"
        caption="Save this range to the city vet archive"
      />
      <ReportsTab
        data={data}
        kind={reportKind}
        format={reportFormat}
        onKindChange={setReportKind}
        onFormatChange={setReportFormat}
        generating={generating}
        onGenerate={generateReport}
      />
    </div>
  );
}

function SectionHeading({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-ink/[0.07] pt-4 first:border-t-0 first:pt-0">
      <h2 className="font-display text-[1rem] font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      <p className="text-[0.6875rem] text-ink/45">{caption}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon,
  tone,
  betterWhenDown,
}: {
  label: string;
  value: number | string;
  delta: AnalyticsDelta;
  icon: typeof FileWarning;
  tone: StatTone;
  betterWhenDown: boolean;
}) {
  const direction = deltaTone(delta);
  const good =
    direction === "flat"
      ? null
      : betterWhenDown
        ? direction === "down"
        : direction === "up";
  return (
    <div className="relative">
      <StatCard label={label} value={value} hint={formatDelta(delta)} icon={icon} tone={tone} />
      <span
        className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${
          good === null ? "bg-ink/15" : good ? "bg-moss" : "bg-[#b45309]"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

function OverviewTab({ data }: { data: AnalyticsDashboardDto }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <ActivityChart data={data.overview.activity} />
      <BarPanel
        title="Reports by barangay"
        caption="Top five in range"
        note="The longest bar is the barangay producing the most reports — the best place to focus outreach and patrols."
        slices={data.geography.barangays.slice(0, 5).map((row) => ({
          label: row.name,
          value: row.reports,
        }))}
      />
    </div>
  );
}

function AdoptionsTab({ data }: { data: AnalyticsDashboardDto }) {
  const { adoptions } = data;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdoptionChart data={adoptions.series} />
        <Panel
          title="Adoption funnel"
          caption="Where applications sit in range"
          note="Each slice is a stage of the application journey. A large early-stage slice means many applications stall before approval."
        >
          <AnalyticsDonutChart
            data={stageMix(adoptions.funnel)}
            centerValue={adoptions.funnel[0]?.value ?? 0}
            centerLabel="applications"
            ariaLabel="Adoption funnel"
          />
        </Panel>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <BarPanel
          title="Time to adoption"
          caption="Days from application"
          note="Longer bars mean animals waited longer to be adopted. Use this to spot slow stages in the process."
          slices={adoptions.timeToAdoption}
        />
        <Panel
          title="Adopted by species"
          caption="Released in range"
          note="Compares how many dogs and cats were adopted. A taller bar means that species found homes more often."
        >
          <AnalyticsBarChart
            data={adoptions.bySpecies}
            ariaLabel="Adopted by species"
          />
        </Panel>
        <Panel
          title="Follow-up health"
          caption="Post-adoption checks"
          note="Coverage shows the share of adopted animals that received a follow-up check. Higher is better for welfare tracking."
        >
          <AnalyticsDonutChart
            data={[
              { label: "With follow-up", value: adoptions.followups.withFollowup },
              {
                label: "Not yet checked",
                value: Math.max(
                  adoptions.followups.released - adoptions.followups.withFollowup,
                  0,
                ),
              },
            ]}
            centerValue={`${
              adoptions.followups.released > 0
                ? Math.round(
                    (adoptions.followups.withFollowup / adoptions.followups.released) * 100,
                  )
                : 0
            }%`}
            centerLabel="coverage"
            size={140}
            thickness={18}
            ariaLabel="Follow-up coverage"
          />
          <dl className="mt-3 space-y-1.5 border-t border-ink/[0.06] pt-3 text-[0.6875rem]">
            <Row label="Released adoptions" value={adoptions.followups.released} />
            <Row label="Avg follow-ups" value={adoptions.followups.avgFollowups} />
          </dl>
        </Panel>
      </div>
      <DataTable
        title="Adoptions by barangay"
        caption="Applications and approvals in range"
        headers={["Barangay", "Applications", "Approved", "Approval rate", "Median days"]}
        rows={adoptions.barangayTable.map((row) => [
          row.barangay,
          String(row.applications),
          String(row.approved),
          `${row.approvalRate}%`,
          `${row.medianDays}d`,
        ])}
      />
    </div>
  );
}

function RescuesTab({ data }: { data: AnalyticsDashboardDto }) {
  const { rescues } = data;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="Report → rescue funnel"
          caption="Pipeline in range"
          note="The arc shows the share of submitted reports that ended in a completed rescue. A fuller arc means a stronger pipeline."
        >
          <AnalyticsGaugeChart
            value={rescues.funnel[rescues.funnel.length - 1]?.value ?? 0}
            max={rescues.funnel[0]?.value ?? 0}
            label="rescued of submitted"
            caption={`${
              rescues.funnel[rescues.funnel.length - 1]?.value ?? 0
            } of ${rescues.funnel[0]?.value ?? 0} reports resolved in range`}
          />
        </Panel>
        <DurationPanel
          durations={rescues.durations}
          note="Longer bars mean that stage takes more time. A large gap between mean and median signals a few outliers are slowing things down."
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <BarPanel
          title="Outcome mix"
          caption="Reports in range"
          note="Shows how reports were resolved. The tallest bar is the most common outcome."
          slices={rescues.outcomes}
        />
        <BarPanel
          title="Rescuer workload"
          caption="Top 3 by assignments in range"
          note="Taller bars mean more assignments — useful for balancing work across the team."
          slices={rescues.workload.slice(0, 3).map((row) => ({
            label: row.label,
            value: row.assignments,
          }))}
        />
      </div>
      <ThroughputChart data={rescues.throughput} />
      <DataTable
        title="Rescue efficiency by barangay"
        caption="Volume, outcomes, and response time"
        headers={["Barangay", "Received", "Rescued", "Open", "Avg response"]}
        rows={rescues.barangayTable.map((row) => [
          row.barangay,
          String(row.received),
          String(row.rescued),
          String(row.open),
          formatHours(row.avgResponseHours),
        ])}
      />
    </div>
  );
}

function GeographyTab({
  data,
  page,
  onPageChange,
}: {
  data: AnalyticsDashboardDto;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.geography.barangays.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = data.geography.barangays.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <BarPanel
          title="Barangay ranking"
          caption="Reports in range"
          note="Ranks barangays by report volume. The top bar is the busiest area and the best place to start coordinating resources."
          slices={data.geography.barangays.slice(0, 10).map((row) => ({
            label: row.name,
            value: row.reports,
          }))}
        />
        <Panel
          title="Urgency mix"
          caption="All reports in range"
          note="Shows the urgency profile of reports. A large critical share means the caseload needs faster response."
        >
          <AnalyticsDonutChart
            data={data.geography.urgency}
            centerValue={data.geography.urgency.reduce((sum, row) => sum + row.value, 0)}
            centerLabel="reports"
            ariaLabel="Urgency mix"
          />
        </Panel>
      </div>

      <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="border-b border-ink/[0.07] px-4 py-3">
          <h3 className="text-[0.8125rem] font-semibold text-ink">Barangay coverage</h3>
          <p className="mt-0.5 text-[0.6875rem] text-ink/45">
            Reports, outcomes, and coverage gaps by barangay
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[0.75rem]">
            <thead className="bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
              <tr>
                {["Barangay", "Reports", "Open", "Rescued", "Adopted", "Avg response", "Last activity"].map(
                  (header) => (
                    <th key={header} className="px-3 py-2 font-semibold">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-ink/[0.02]">
                  <td className="px-3 py-2 font-medium text-ink/75">{row.name}</td>
                  <td className="px-3 py-2 tabular-nums text-ink/60">{row.reports}</td>
                  <td className="px-3 py-2 tabular-nums text-ink/60">{row.open}</td>
                  <td className="px-3 py-2 tabular-nums text-ink/60">{row.rescued}</td>
                  <td className="px-3 py-2 tabular-nums text-ink/60">{row.adopted}</td>
                  <td className="px-3 py-2 tabular-nums text-ink/60">
                    {formatHours(row.avgResponseHours)}
                  </td>
                  <td className="px-3 py-2 text-ink/50">
                    {row.lastActivity ? row.lastActivity.slice(0, 10) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-ink/40">
                    No barangay activity in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={data.geography.barangays.length}
          pageSize={pageSize}
          itemLabel="barangays"
          onPageChange={onPageChange}
          className="border-t border-ink/[0.07] px-4 py-2.5"
        />
      </section>
    </div>
  );
}

function ReportsTab({
  data,
  kind,
  format,
  onKindChange,
  onFormatChange,
  generating,
  onGenerate,
}: {
  data: AnalyticsDashboardDto;
  kind: string;
  format: string;
  onKindChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <h3 className="text-[0.8125rem] font-semibold text-ink">Generate a report</h3>
        <p className="mt-0.5 text-[0.6875rem] text-ink/45">
          Save the current range as a report record for the city vet archive.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="text-[0.625rem] font-medium text-ink/50">Kind</span>
            <Select
              name="report-kind"
              value={kind}
              onChange={onKindChange}
              options={[
                { value: "adoption_trends", label: "Adoption trends" },
                { value: "rescue_efficiency", label: "Rescue efficiency" },
                { value: "geographic_distribution", label: "Geographic distribution" },
                { value: "health_summary", label: "Health summary" },
              ]}
              size="compact"
              className="mt-1 w-52"
            />
          </label>
          <label className="block">
            <span className="text-[0.625rem] font-medium text-ink/50">Format</span>
            <Select
              name="report-format"
              value={format}
              onChange={onFormatChange}
              options={[
                { value: "csv", label: "CSV" },
                { value: "xlsx", label: "Excel" },
                { value: "pdf", label: "PDF" },
              ]}
              size="compact"
              className="mt-1 w-32"
            />
          </label>
          <Button variant="primary" size="md" disabled={generating} onClick={onGenerate}>
            <FileText className="h-3.5 w-3.5" strokeWidth={1.9} />
            {generating ? "Generating…" : "Generate report"}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="border-b border-ink/[0.07] px-4 py-3">
          <h3 className="text-[0.8125rem] font-semibold text-ink">Report history</h3>
          <p className="mt-0.5 text-[0.6875rem] text-ink/45">Recent generated reports</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[0.75rem]">
            <thead className="bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
              <tr>
                {["Kind", "Range", "Format", "Generated by", "Created"].map((header) => (
                  <th key={header} className="px-3 py-2 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {data.generatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-ink/[0.02]">
                  <td className="px-3 py-2 font-medium text-ink/75">
                    {report.kind.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 text-ink/55">
                    {report.dateFrom.slice(0, 10)} → {report.dateTo.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 uppercase text-ink/55">{report.format ?? "—"}</td>
                  <td className="px-3 py-2 text-ink/55">{report.generatedBy ?? "—"}</td>
                  <td className="px-3 py-2 text-ink/45">{report.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
              {data.generatedReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-ink/40">
                    No reports generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ActivityChart({ data }: { data: AnalyticsDashboardDto["overview"]["activity"] }) {
  return (
    <Panel
      title="Reports vs adoptions"
      caption="Daily activity in the selected range"
      note="Compare the two lines each day. When reports run above adoptions, incoming cases are outpacing placements."
      legend={
        <>
          <Legend color="#2563eb" label="Reports" />
          <Legend color="#c99a4e" label="Adoptions" />
        </>
      }
    >
      <AnalyticsAreaChart
        ariaLabel="Reports and adoptions over time"
        series={[
          { key: "reports", label: "Reports", color: "#2563eb" },
          { key: "adoptions", label: "Adoptions", color: "#c99a4e" },
        ]}
        data={data.map((point) => ({
          label: point.label,
          fullLabel: point.fullLabel,
          values: { reports: point.reports, adoptions: point.adoptions },
        }))}
      />
    </Panel>
  );
}

function AdoptionChart({ data }: { data: AnalyticsDashboardDto["adoptions"]["series"] }) {
  return (
    <Panel
      title="Applications over time"
      caption="Submitted, approved, and rejected"
      note="Tracks demand for adoption. If submitted rises but approved stays flat, applications are building up in review."
      legend={
        <>
          <Legend color="#2563eb" label="Submitted" />
          <Legend color="#0f766e" label="Approved" />
          <Legend color="#b45309" label="Rejected" />
        </>
      }
    >
      <AnalyticsAreaChart
        ariaLabel="Adoption applications over time"
        series={[
          { key: "submitted", label: "Submitted", color: "#2563eb" },
          { key: "approved", label: "Approved", color: "#0f766e" },
          { key: "rejected", label: "Rejected", color: "#b45309" },
        ]}
        data={data.map((point) => ({
          label: point.label,
          fullLabel: point.fullLabel,
          values: {
            submitted: point.submitted,
            approved: point.approved,
            rejected: point.rejected,
          },
        }))}
      />
    </Panel>
  );
}

function ThroughputChart({ data }: { data: AnalyticsDashboardDto["rescues"]["throughput"] }) {
  return (
    <Panel
      title="Weekly throughput"
      caption="Reports resolved vs operations completed"
      note="Shows how much work is getting done each week. A widening gap between the lines means resolutions are falling behind operations."
      legend={
        <>
          <Legend color="#2563eb" label="Resolved" />
          <Legend color="#0f766e" label="Completed" />
        </>
      }
    >
      <AnalyticsAreaChart
        ariaLabel="Reports resolved and operations completed"
        series={[
          { key: "resolved", label: "Resolved", color: "#2563eb" },
          { key: "completed", label: "Completed", color: "#0f766e" },
        ]}
        data={data.map((point) => ({
          label: point.label,
          fullLabel: point.fullLabel,
          values: { resolved: point.resolved, completed: point.completed },
        }))}
        height={190}
      />
    </Panel>
  );
}

function ChartNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 border-t border-ink/[0.06] pt-2 text-[0.6875rem] leading-[1.5] text-ink/45">
      {children}
    </p>
  );
}

function Panel({
  title,
  caption,
  legend,
  note,
  children,
}: {
  title: string;
  caption: string;
  legend?: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-[0.6875rem] text-ink/45">{caption}</p>
        </div>
        {legend && (
          <div className="flex flex-wrap items-center gap-3 text-[0.625rem] text-ink/45">
            {legend}
          </div>
        )}
      </div>
      <div className="mt-3">{children}</div>
      {note && <ChartNote>{note}</ChartNote>}
    </section>
  );
}

function DurationPanel({
  durations,
  note,
}: {
  durations: AnalyticsDashboardDto["rescues"]["durations"];
  note?: string;
}) {
  const max = Math.max(1, ...durations.map((row) => Math.max(row.meanHours, row.medianHours)));
  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-ink">Stage durations</h3>
          <p className="mt-0.5 text-[0.6875rem] text-ink/45">Mean and median hours</p>
        </div>
        <div className="flex items-center gap-3 text-[0.625rem] text-ink/45">
          <Legend color="#2563eb" label="Mean" />
          <Legend color="#c99a4e" label="Median" />
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {durations.map((row) => (
          <li key={row.label}>
            <Tooltip
              align="start"
              content={
                <>
                  <span className="block text-[0.625rem] font-medium uppercase tracking-[0.08em] text-paper/50">
                    {row.label}
                  </span>
                  <span className="block text-[0.8125rem] font-semibold text-paper">
                    Mean {formatHours(row.meanHours)} · Median {formatHours(row.medianHours)}
                  </span>
                </>
              }
            >
              <div className="flex items-baseline justify-between text-[0.6875rem]">
                <span className="text-ink/60">{row.label}</span>
                <span className="tabular-nums text-ink/40">
                  {formatHours(row.meanHours)} · {formatHours(row.medianHours)}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${(row.meanHours / max) * 100}%` }} />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div className="h-full rounded-full bg-[#c99a4e]" style={{ width: `${(row.medianHours / max) * 100}%` }} />
                </div>
              </div>
            </Tooltip>
          </li>
        ))}
      </ul>
      {note && <ChartNote>{note}</ChartNote>}
    </section>
  );
}

function BarPanel({
  title,
  caption,
  slices,
  note,
}: {
  title: string;
  caption: string;
  slices: AnalyticsSlice[];
  note?: string;
}) {
  const max = Math.max(1, ...slices.map((slice) => slice.value));
  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <h3 className="text-[0.8125rem] font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-[0.6875rem] text-ink/45">{caption}</p>
      <ul className="mt-3 space-y-2.5">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="rounded px-1 py-0.5 transition-colors hover:bg-ink/[0.03]"
          >
            <Tooltip
              align="start"
              content={
                <>
                  <span className="block text-[0.625rem] font-medium uppercase tracking-[0.08em] text-paper/50">
                    {slice.label.replace(/_/g, " ")}
                  </span>
                  <span className="block text-[0.8125rem] font-semibold text-paper">
                    {slice.value}
                  </span>
                </>
              }
            >
              <div className="flex items-baseline justify-between gap-3 text-[0.6875rem]">
                <span className="truncate capitalize text-ink/60">{slice.label.replace(/_/g, " ")}</span>
                <span className="tabular-nums text-ink/40">{slice.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className="h-full rounded-full bg-clay transition-[width]"
                  style={{ width: `${slice.value === 0 ? 0 : Math.max(4, (slice.value / max) * 100)}%` }}
                />
              </div>
            </Tooltip>
          </li>
        ))}
        {slices.length === 0 && <li className="py-2 text-[0.6875rem] text-ink/40">No data in this period.</li>}
      </ul>
      {note && <ChartNote>{note}</ChartNote>}
    </section>
  );
}

function DataTable({
  title,
  caption,
  headers,
  rows,
}: {
  title: string;
  caption: string;
  headers: string[];
  rows: string[][];
}) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage],
  );

  return (
    <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="border-b border-ink/[0.07] px-4 py-3">
        <h3 className="text-[0.8125rem] font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-[0.6875rem] text-ink/45">{caption}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[0.75rem]">
          <thead className="bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.05]">
            {visible.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="hover:bg-ink/[0.02]">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-3 py-2 ${cellIndex === 0 ? "font-medium text-ink/75" : "tabular-nums text-ink/55"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-3 py-8 text-center text-ink/40">
                  No data in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={rows.length}
        pageSize={pageSize}
        itemLabel="rows"
        onPageChange={setPage}
        className="border-t border-ink/[0.07] px-4 py-2.5"
      />
    </section>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink/75">{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
