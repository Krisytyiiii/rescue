import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { reportsService, type ListReportsQuery } from "@furescue/core";

import { toReportCardData } from "./report-card-data";
import { ReportsGrid } from "./reports-grid";

interface ReportsResultsProps {
  query: ListReportsQuery;
  page: number;
  baseParams: Record<string, string>;
  hasFilters: boolean;
}

function pageHref(baseParams: Record<string, string>, target: number): string {
  const next = new URLSearchParams(baseParams);
  if (target > 1) next.set("page", String(target));
  const query = next.toString();
  return query ? `/admin/reports?${query}` : "/admin/reports";
}

/** Streamed results section — keyed by the active filters so stale cards are replaced. */
export async function ReportsResults({ query, page, baseParams, hasFilters }: ReportsResultsProps) {
  const { items, meta } = await reportsService.list(query);
  const first = items.length === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const last = (meta.page - 1) * meta.pageSize + items.length;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-moss/10 text-moss">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-[0.9375rem] font-medium text-ink">
          {hasFilters ? "No reports match these filters" : "No reports yet"}
        </p>
        <p className="mt-1 max-w-[40ch] text-[0.8125rem] leading-[1.55] text-ink/55">
          {hasFilters
            ? "Try clearing a filter or widening the search."
            : "New resident submissions will appear here for verification."}
        </p>
        {hasFilters && (
          <Link
            href="/admin/reports"
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
          >
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="px-4 pt-1 text-[0.6875rem] text-ink/40">
        Showing {first}–{last} of {meta.total}
      </p>

      <ReportsGrid reports={items.map(toReportCardData)} />

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-ink/[0.07] px-4 py-3">
          <p className="text-[0.75rem] text-ink/45">
            Page {page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            {meta.hasPrevious ? (
              <Link
                href={pageHref(baseParams, meta.page - 1)}
                className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-lg border border-ink/[0.06] px-3 text-[0.75rem] font-medium text-ink/25">
                Previous
              </span>
            )}

            {meta.hasNext ? (
              <Link
                href={pageHref(baseParams, meta.page + 1)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
              >
                Next
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink/[0.06] px-3 text-[0.75rem] font-medium text-ink/25">
                Next
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
