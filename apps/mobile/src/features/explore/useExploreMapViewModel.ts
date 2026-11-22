import { useCallback, useEffect, useMemo, useState } from "react";

import { reportMapDataSource } from "@/data";
import type { ReportMapDataSource } from "@/data/report-map";
import {
  countReportMarkers,
  filterReportMarkers,
  type ReportMapMarker,
  type ReportStatusFilter,
} from "@/domain/report-map";

/**
 * Presentation state for the Explore map. Filtering and counts are pure
 * domain helpers so the screen only renders the result.
 */
export function useExploreMapViewModel(
  source: ReportMapDataSource = reportMapDataSource,
) {
  const [markers, setMarkers] = useState<ReportMapMarker[] | null>(null);
  const [filter, setFilter] = useState<ReportStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loaded = await source.loadMarkers();
    setMarkers(loaded);
    setError(null);
  }, [source]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) {
          setMarkers([]);
          setError("Couldn't load reports around you.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const counts = useMemo(
    () => countReportMarkers(markers ?? []),
    [markers],
  );
  const visible = useMemo(
    () => filterReportMarkers(markers ?? [], filter),
    [markers, filter],
  );
  const selected = useMemo(
    () => visible.find((marker) => marker.id === selectedId) ?? null,
    [visible, selectedId],
  );

  const changeFilter = useCallback((next: ReportStatusFilter) => {
    setFilter(next);
    setSelectedId(null);
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  return {
    counts,
    visible,
    filter,
    setFilter: changeFilter,
    selected,
    selectedId,
    select,
    loading,
    error,
    reload: load,
  };
}
