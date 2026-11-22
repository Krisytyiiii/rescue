"use client";

import { ChevronDown, ExternalLink, Flame, Map, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { SecondaryTabFilters } from "@/components/ui/secondary-tab-filters";
import { TabFilters } from "@/components/ui/tab-filters";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { ReportMarkerRow, RescueConsoleData } from "@furescue/core";

import { RescuesMap } from "./rescues-map";
import {
  REPORT_STATUS_ORDER,
  formatClock,
  formatDateTime,
  humanize,
  matchesReportQuery,
  reportStatusMeta,
  urgencyMeta,
} from "./rescues-utils";

type View = "map" | "heat";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  ...REPORT_STATUS_ORDER.map((status) => ({
    id: status,
    label: reportStatusMeta(status).label,
  })),
];

interface RescuesConsoleProps {
  data: RescueConsoleData;
}

export function RescuesConsole({ data }: RescuesConsoleProps) {
  const [view, setView] = useState<View>("map");
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleReports = useMemo(
    () =>
      data.reports.filter(
        (report) =>
          (filter === "all" || report.reportStatus === filter) &&
          matchesReportQuery(report, query),
      ),
    [data.reports, filter, query],
  );

  const counts = data.reportCounts;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-2 border-b border-ink/[0.08] pb-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TabFilters
            ariaLabel="Rescue view"
            value={view}
            onChange={setView}
            options={[
              { id: "map", label: "Map", icon: Map },
              { id: "heat", label: "Heat map", icon: Flame },
            ]}
          />

          <SearchInput
            value={query}
            onValueChange={setQuery}
            showIcon={false}
            label="Search reports"
            placeholder="Report, barangay, landmark"
            className="w-full sm:w-56"
          />
        </div>

        <SecondaryTabFilters
          ariaLabel="Rescue status"
          value={filter}
          onChange={setFilter}
          wrap
          options={STATUS_FILTERS.map((item) => {
            const meta = item.id === "all" ? null : reportStatusMeta(item.id);
            return {
              ...item,
              count:
                item.id === "all"
                  ? counts.total
                  : counts[item.id as keyof typeof counts],
              dot: meta?.pin,
            };
          })}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:h-[calc(100dvh-9.5rem)] lg:min-h-[620px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="group flex max-h-[380px] min-h-0 min-w-0 flex-col lg:max-h-none">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink/45">
              Reports
            </h2>
            <span className="font-mono text-[0.625rem] text-ink/35">
              {visibleReports.length}
            </span>
          </div>

          <ScrollArea className="min-h-0 flex-1 pr-0.5">
            {visibleReports.length === 0 ? (
              <SearchEmpty
                compact
                title="No reports match your search"
                description="Try a different report, barangay, or landmark."
                onClear={() => {
                  setQuery("");
                  setFilter("all");
                }}
                clearLabel="Clear filters"
              />
            ) : (
              <ul className="space-y-2">
                {visibleReports.map((report) => (
                  <ReportRow
                    key={report.reportId}
                    report={report}
                    active={report.reportId === selectedId}
                    onSelect={() =>
                      setSelectedId((current) =>
                        current === report.reportId ? null : report.reportId,
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-ink/[0.08] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.07] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink/45">
                {view === "map" ? "Report map" : "Case density"}
              </h2>
              <span className="font-mono text-[0.625rem] text-ink/35">
                {visibleReports.length}
              </span>
            </div>
            <span className="hidden text-[0.5625rem] text-ink/35 sm:block">
              {view === "map"
                ? "click a dot or card for report details"
                : "heat reflects report density, not rescue severity"}
            </span>
          </div>

          <div className="relative min-h-[420px] flex-1 overflow-hidden">
            <RescuesMap
              reports={visibleReports}
              counts={counts}
              mode={view}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </section>
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.5625rem] text-ink/30">
        <span>Every report is mapped, including unverified submissions.</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#c99a4e]" />
          Submitted
          <span className="h-2 w-2 rounded-full bg-[#1f7a4d]" />
          Verified
          <span className="h-2 w-2 rounded-full bg-[#15803d]" />
          Rescued
        </span>
      </p>
    </div>
  );
}

function ReportRow({
  report,
  active,
  onSelect,
}: {
  report: ReportMarkerRow;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = reportStatusMeta(report.reportStatus);
  const urgency = urgencyMeta(report.urgencyLevel);

  return (
    <li
      className={`overflow-hidden rounded-lg border bg-white transition-shadow ${
        active
          ? "border-ink/20 shadow-[0_6px_18px_-10px_rgba(6,32,20,0.3)] ring-1 ring-ink/10"
          : "border-ink/[0.08] hover:shadow-[0_4px_14px_-10px_rgba(6,32,20,0.22)]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={active}
        className="group/banner relative block w-full overflow-hidden text-left"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${meta.pin}1f 0%, ${meta.pin}0a 42%, transparent 78%)`,
          }}
        />
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[3px] ${active ? "opacity-100" : "opacity-80"}`}
          style={{ backgroundColor: meta.pin }}
        />

        <div className="relative px-3 pb-2.5 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                Community report
              </p>
              <p className="mt-0.5 truncate font-mono text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
                {report.reportCode}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <Badge tone={meta.tone} surface="light">
                {meta.label}
              </Badge>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border border-ink/[0.08] bg-white/70 text-ink/40 transition-all duration-200 group-hover/banner:border-ink/20 group-hover/banner:text-ink/70 ${
                  active ? "rotate-180" : ""
                }`}
              >
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-[0.75rem] leading-[1.5] text-ink/60">
            {report.locationLandmark ?? report.description}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2 text-[0.6875rem] text-ink/45">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${urgency.rule}`} />
              <span className="uppercase tracking-[0.06em] text-ink/35">
                {urgency.label}
              </span>
              <span className="truncate">
                {humanize(report.species)} · {report.barangay ?? "Unmatched"}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">{formatClock(report.submittedAt)}</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-white/55 px-2 py-1.5 text-[0.6875rem] text-ink/50 ring-1 ring-inset ring-white/60">
            {report.rescuer ? (
              <UserAvatar
                src={report.rescuer.profilePhotoUrl}
                className="h-4 w-4"
                iconClassName="h-2.5 w-2.5"
              />
            ) : (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.5rem] font-semibold uppercase text-ink/55">
                —
              </span>
            )}
            <span className="truncate">
              {report.rescuer?.fullName ?? "Unassigned"}
            </span>
            <span className="ml-auto shrink-0 text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/30">
              {active ? "Hide" : "Details"}
            </span>
          </div>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ReportDetails report={report} />
        </div>
      </div>
    </li>
  );
}

function ReportDetails({ report }: { report: ReportMarkerRow }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
  const meta = reportStatusMeta(report.reportStatus);
  const urgency = urgencyMeta(report.urgencyLevel);

  return (
    <div className="border-t border-ink/[0.07] bg-ink/[0.012] p-2.5">
      <div className="relative overflow-hidden rounded-lg border border-ink/[0.08] bg-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${meta.pin}17 0%, ${meta.pin}08 45%, transparent 80%)`,
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: meta.pin }}
        />

        <div className="relative px-3 pb-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
              Report details
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-ink/40">
              <span className={`h-1.5 w-1.5 rounded-full ${urgency.rule}`} />
              {urgency.label} urgency
            </span>
          </div>

          <p className="mt-2 text-[0.75rem] leading-[1.6] text-ink/60">{report.description}</p>

          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-md bg-white/70 p-2.5 ring-1 ring-inset ring-ink/[0.05]">
            <DetailField label="Reporter" value={report.reporter} />
            <DetailField label="Barangay" value={report.barangay ?? "Unmatched"} />
            <DetailField label="Submitted" value={formatDateTime(report.submittedAt)} />
            <DetailField label="Verified" value={formatDateTime(report.verifiedAt)} />
            <DetailField label="Rescuer" value={report.rescuer?.fullName ?? "Unassigned"} />
            <DetailField
              label="Rescue"
              value={
                report.assignmentStatus ? humanize(report.assignmentStatus) : "Not dispatched"
              }
            />
          </dl>
        </div>
      </div>

      <div className="mt-2.5 flex items-start justify-between gap-2 rounded-lg border border-ink/[0.07] bg-white px-2.5 py-2">
        <div className="flex min-w-0 items-start gap-1.5">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ink/35" strokeWidth={1.9} />
          <div className="min-w-0">
            <p className="truncate text-[0.6875rem] text-ink/65">
              {report.locationLandmark ?? "No landmark provided"}
            </p>
            <p className="font-mono text-[0.625rem] text-ink/35">
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </p>
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-[0.625rem] font-medium text-clay underline-offset-2 hover:underline"
        >
          Maps
          <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
        </a>
      </div>

      {report.statusHistory.length > 0 && (
        <div className="mt-3 border-t border-ink/[0.07] pt-2.5">
          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
            Timeline
          </p>
          <ol className="mt-1.5 space-y-1.5">
            {report.statusHistory.slice(0, 4).map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[0.6875rem] text-ink/55">
                  {humanize(entry.newStatus)}
                  {entry.remarks ? ` — ${entry.remarks}` : ""}
                </span>
                <span className="shrink-0 text-[0.625rem] text-ink/30">
                  {formatClock(entry.changedAt)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.5rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.6875rem] font-semibold text-ink/70">{value}</dd>
    </div>
  );
}
