import { useCallback, useEffect, useState } from "react";

import { rescuerAssignmentsDataSource } from "@/data";
import {
  selectRescuerReportInsights,
  type RescuerReportInsights,
} from "@/domain/rescuer-reports";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  data?: RescuerHomeDataSource;
}

/** Loads the rescuer's operations and derives all-time report insights. */
export function useRescuerReportsViewModel({
  data = rescuerAssignmentsDataSource,
}: Options = {}) {
  const [insights, setInsights] = useState<RescuerReportInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snapshot = await data.loadHome();
    setInsights(selectRescuerReportInsights(snapshot.assignments));
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    try {
      await load();
    } catch {
      setError("Couldn't load your reports.");
    }
  }, [load]);

  return { insights, loading, error, reload };
}
