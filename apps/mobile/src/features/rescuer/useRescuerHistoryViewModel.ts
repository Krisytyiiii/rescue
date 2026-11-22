import { useCallback, useEffect, useState } from "react";

import { rescuerAssignmentsDataSource } from "@/data";
import {
  RESCUER_HISTORY_STATUSES,
  selectRescuerHistory,
  type RescuerAssignment,
  type RescuerHistoryState,
} from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  data?: RescuerHomeDataSource;
}

/** Presentation state for the accepted/failed/declined/completed history screen. */
export function useRescuerHistoryViewModel({
  data = rescuerAssignmentsDataSource,
}: Options = {}) {
  const [history, setHistory] = useState<RescuerHistoryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snapshot = await data.loadHome();
    const assignments: RescuerAssignment[] = snapshot.assignments;
    setHistory(selectRescuerHistory(assignments, undefined, RESCUER_HISTORY_STATUSES));
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your rescue history.");
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
      setError("Couldn't load your rescue history.");
    }
  }, [load]);

  return { history, loading, error, reload };
}
