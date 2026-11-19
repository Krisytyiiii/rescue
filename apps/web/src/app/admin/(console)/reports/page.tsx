import type { Metadata } from "next";
import { FileWarning } from "lucide-react";
import { Suspense } from "react";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { ReportsResults } from "@/components/admin/reports/reports-results";
import { ReportsResultsSkeleton } from "@/components/admin/reports/reports-results-skeleton";
import { ReportsStats, ReportsStatsSkeleton } from "@/components/admin/reports/reports-stats";
import { ReportsToolbar } from "@/components/admin/reports/reports-toolbar";
import type { ListReportsQuery, ReportStatus } from "@furescue/core";

export const metadata: Metadata = {
  title: "Community reports — FuRescue admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

const REPORT_STATUSES: ReportStatus[] = [
  "submitted",
  "verified",
  "assigned",
  "in_progress",
  "rescued",
  "unable_to_locate",
  "rejected",
  "closed",
];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const q = first(params.q).trim();
  const statusParam = first(params.status);
  const urgency = first(params.urgency);
  const reportType = first(params.type);
  const species = first(params.species);
  const pageParam = Number.parseInt(first(params.page), 10);

  const status = REPORT_STATUSES.includes(statusParam as ReportStatus)
    ? (statusParam as ReportStatus)
    : undefined;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const hasFilters = Boolean(q || status || urgency || reportType || species);

  const listQuery: ListReportsQuery = {
    page,
    pageSize: PAGE_SIZE,
    ...(q ? { search: q } : {}),
    ...(status ? { status } : {}),
    ...(urgency ? { urgencyLevel: urgency as "low" | "medium" | "high" | "critical" } : {}),
    ...(reportType ? { reportType: reportType as "stray" | "injured" | "abandoned" } : {}),
    ...(species ? { species: species as "dog" | "cat" | "unknown" } : {}),
  };

  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (status) baseParams.status = status;
  if (urgency) baseParams.urgency = urgency;
  if (reportType) baseParams.type = reportType;
  if (species) baseParams.species = species;

  // A new key discards stale results immediately and swaps in the skeleton.
  const resultsKey = [q, statusParam, urgency, reportType, species, page].join("|");

  return (
    <div className="w-full">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Community reports
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-[1.65] text-ink/55 lg:whitespace-nowrap">
            Verify incoming stray, injured, and abandoned reports, flag duplicates, and
            move verified cases into the rescue pipeline.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
          <FileWarning className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          Live report feed
        </span>
      </div>

      <Suspense fallback={<ReportsStatsSkeleton />}>
        <ReportsStats />
      </Suspense>

      <section className="mt-4 flex min-h-[480px] flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
          <h2 className="text-[0.9375rem] font-semibold text-ink">
            {hasFilters ? "Filtered reports" : "All reports"}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink/45">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Results update as you filter
          </span>
        </div>

        <div className="px-4 py-4">
          <ReportsToolbar
            q={q}
            status={statusParam}
            urgency={urgency}
            reportType={reportType}
            species={species}
          />
        </div>

        <Suspense key={resultsKey} fallback={<ReportsResultsSkeleton />}>
          <ReportsResults
            query={listQuery}
            page={page}
            baseParams={baseParams}
            hasFilters={hasFilters}
          />
        </Suspense>
      </section>
    </div>
  );
}
