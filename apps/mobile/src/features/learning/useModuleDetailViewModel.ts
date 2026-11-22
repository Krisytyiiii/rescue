import { useCallback, useEffect, useState } from "react";

import { learningDataSource } from "@/data";
import type { LearningDataSource } from "@/data";
import type { LearningModule } from "@/domain/learning";

interface ModuleDetailOptions {
  data?: LearningDataSource;
}

function messageFor(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/** Presentation state for one published course and its full lesson content. */
export function useModuleDetailViewModel(
  id: number,
  { data = learningDataSource }: ModuleDetailOptions = {},
) {
  const [module, setModule] = useState<LearningModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const record = await data.loadModule(id);
    setModule(record);
    setError(null);
  }, [data, id]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setModule(null);
          setError(messageFor(cause, "We couldn't load this course."));
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
      setModule(null);
      setError(messageFor(cause, "We couldn't load this course."));
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { module, loading, error, reload };
}
