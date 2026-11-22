import { useCallback, useEffect, useState } from "react";

import { reportHistoryDataSource } from "@/data";
import type { ReportHistoryDataSource } from "@/data";
import type { MyReport } from "@/domain/report-submission";

const LOAD_ERROR = "We couldn't load that report.";
const MISSING_ERROR = "We couldn't find that report.";

/**
 * Loads one of the resident's reports for the detail screen. Reads through the
 * same history port as the list so the case file always matches the card.
 */
export function useReportDetailViewModel(
  id: string,
  data: ReportHistoryDataSource = reportHistoryDataSource,
) {
  const [report, setReport] = useState<MyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const reports = await data.listMyReports();
      const found = reports.find((item) => item.id === id) ?? null;
      setReport(found);
      setError(found ? null : MISSING_ERROR);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [data, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { report, loading, error, reload };
}
