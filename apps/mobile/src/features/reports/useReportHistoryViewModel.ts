import { useCallback, useEffect, useState } from "react";

import { reportHistoryDataSource } from "@/data";
import type { ReportHistoryDataSource } from "@/data";
import type { MyReport } from "@/domain/report-submission";

const LOAD_ERROR = "We couldn't load your reports.";

/**
 * Owns the resident's report history: loading, errors, and refresh. The Report
 * screen only renders this state through `ReportHistorySection`.
 */
export function useReportHistoryViewModel(
  data: ReportHistoryDataSource = reportHistoryDataSource,
) {
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await data.listMyReports();
      setReports(list);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { reports, loading, error, reload };
}
