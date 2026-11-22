import { useCallback, useEffect, useState } from "react";

import { rescuerQueueDataSource } from "@/data";
import { selectRescuerQueue, type QueuedReport } from "@/domain/rescuer";

import type { RescuerQueueDataSource } from "@/data/rescuer-queue";

interface Options {
  data?: RescuerQueueDataSource;
}

/** Presentation state for the read-only queue. */
export function useRescuerQueueViewModel({
  data = rescuerQueueDataSource,
}: Options = {}) {
  const [reports, setReports] = useState<QueuedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loaded = await data.loadQueue();
    setReports(selectRescuerQueue(loaded));
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load the queue.");
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
      setError("Couldn't load the queue.");
    }
  }, [load]);

  return { reports, loading, error, reload };
}
