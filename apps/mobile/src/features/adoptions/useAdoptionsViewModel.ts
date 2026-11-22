import { useCallback, useEffect, useState } from "react";

import { adoptionsDataSource } from "@/data";
import type { AdoptionsDataSource } from "@/data";
import type { AdoptionRequest } from "@/domain/adoptions";

interface AdoptionsOptions {
  data?: AdoptionsDataSource;
}

/**
 * Presentation state for the read-only Adoption screen. Loading and error
 * handling live here; status filtering stays a pure view concern.
 */
export function useAdoptionsViewModel({
  data = adoptionsDataSource,
}: AdoptionsOptions = {}) {
  const [adoptions, setAdoptions] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const records = await data.loadAdoptions();
    setAdoptions(records);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setAdoptions([]);
          setError(
            cause instanceof Error ? cause.message : "Couldn't load the adoptions.",
          );
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
    try {
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't load the adoptions.",
      );
    }
  }, [load]);

  return { adoptions, loading, error, reload };
}
