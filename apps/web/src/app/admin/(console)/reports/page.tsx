import type { Metadata } from "next";
import { FileWarning } from "lucide-react";
import { Suspense } from "react";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { toReportCardData } from "@/components/admin/reports/report-card-data";
import { ReportsConsole } from "@/components/admin/reports/reports-console";
import { ReportsStats, ReportsStatsSkeleton } from "@/components/admin/reports/reports-stats";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { reportsService } from "@furescue/core";

export const metadata: Metadata = {
  title: "Community reports — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  // Loaded once. Search and filters run against this list in the browser.
  const reports = await fetchAllPages((page, pageSize) =>
    reportsService.list({ page, pageSize }),
  );
  const cards = reports.map(toReportCardData);

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
          <h2 className="text-[0.9375rem] font-semibold text-ink">All reports</h2>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink/45">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Results update as you type
          </span>
        </div>

        <ReportsConsole reports={cards} />
      </section>
    </div>
  );
}
