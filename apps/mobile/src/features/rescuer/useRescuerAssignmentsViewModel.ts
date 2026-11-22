import { useCallback, useEffect, useMemo, useState } from "react";

import { rescuerAssignmentsDataSource } from "@/data";
import {
  selectAssignmentBoard,
  type AssignmentBoardFilter,
  type RescuerAssignment,
} from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  data?: RescuerHomeDataSource;
}

/**
 * Assignments board state: every report currently assigned to the rescuer,
 * including offers that were accepted or declined. Filtering and search run in
 * the pure domain selector so the screen stays presentational.
 */
export function useRescuerAssignmentsViewModel({
  data = rescuerAssignmentsDataSource,
}: Options = {}) {
  const [assignments, setAssignments] = useState<RescuerAssignment[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AssignmentBoardFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snapshot = await data.loadHome();
    setAssignments(snapshot.assignments);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your assignments.");
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
      setError("Couldn't load your assignments.");
    }
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      setError("Couldn't load your assignments.");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const visible = useMemo(
    () => selectAssignmentBoard(assignments, { search, filter }),
    [assignments, search, filter],
  );

  const resetFilters = useCallback(() => {
    setSearch("");
    setFilter("all");
  }, []);

  return {
    assignments,
    visible,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  };
}
