import { useCallback, useEffect, useState } from "react";

import { learningDataSource } from "@/data";
import type { LearningDataSource } from "@/data";
import type { LearningModuleSummary } from "@/domain/learning";

interface ModulesOptions {
  data?: LearningDataSource;
}

function messageFor(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/**
 * Presentation state for the resident modules list: every course the City Vet
 * team has published.
 */
export function useModulesViewModel({
  data = learningDataSource,
}: ModulesOptions = {}) {
  const [modules, setModules] = useState<LearningModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const records = await data.loadModules();
    setModules(records);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setModules([]);
          setError(messageFor(cause, "We couldn't load the modules."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await load();
    } catch (cause) {
      setModules([]);
      setError(messageFor(cause, "We couldn't load the modules."));
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { modules, loading, error, reload };
}
