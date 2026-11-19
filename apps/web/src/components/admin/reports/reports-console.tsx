"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";

import { SearchEmpty } from "@/components/ui/search-empty";

import { ReportsGrid, type ReportCardData } from "./reports-grid";
import {
  EMPTY_REPORT_FILTERS,
  ReportsToolbar,
  type ReportFilters,
} from "./reports-toolbar";

const PAGE_SIZE = 10;

function matchesQuery(report: ReportCardData, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    report.reportCode,
    report.description,
    report.locationLandmark ?? "",
    report.barangay ?? "",
    report.reporter,
    report.verifier ?? "",
    report.status,
    report.species,
    report.reportType,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

interface ReportsConsoleProps {
  reports: ReportCardData[];
}

/**
 * Entirely client-side report directory. The complete list is loaded once by
 * the server; every keystroke and filter change narrows that in-memory list,
 * so results update instantly and no request can resolve out of order.
 */
export function ReportsConsole({ reports }: ReportsConsoleProps) {
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_REPORT_FILTERS);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      reports.filter(
        (report) =>
          (!filters.status || report.status === filters.status) &&
          (!filters.urgency || report.urgencyLevel === filters.urgency) &&
          (!filters.reportType || report.reportType === filters.reportType) &&
          (!filters.species || report.species === filters.species) &&
          matchesQuery(report, filters.q),
      ),
    [reports, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const first = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const visible = filtered.slice(first === 0 ? 0 : first - 1, last);
  const hasFilters = Object.values(filters).some(Boolean);

  function patch(next: Partial<ReportFilters>) {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-4">
        <ReportsToolbar filters={filters} onChange={patch} />
      </div>

      {filtered.length === 0 ? (
        <SearchEmpty
          className="flex-1"
          icon={hasFilters ? undefined : CheckCircle2}
          title={hasFilters ? "No reports match your search" : "No reports yet"}
          description={
            hasFilters
              ? "Try a different word, or clear a filter to see more reports."
              : "New resident submissions will appear here for verification."
          }
          onClear={
            hasFilters
              ? () => {
                  setPage(1);
                  setFilters(EMPTY_REPORT_FILTERS);
                }
              : undefined
          }
          clearLabel="Clear filters"
        />
      ) : (
        <>
          <p className="px-4 pt-1 text-[0.6875rem] text-ink/40">
            Showing {first}–{last} of {filtered.length}
          </p>

          <ReportsGrid reports={visible} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-ink/[0.07] px-4 py-3">
              <p className="text-[0.75rem] text-ink/45">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors enabled:hover:border-ink/20 enabled:hover:text-ink disabled:border-ink/[0.06] disabled:text-ink/25"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors enabled:hover:border-ink/20 enabled:hover:text-ink disabled:border-ink/[0.06] disabled:text-ink/25"
                >
                  Next
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
