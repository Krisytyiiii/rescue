import { useCallback, useEffect, useState } from "react";

import { adoptionApplicationDataSource } from "@/data";
import type { AdoptionApplicationDataSource } from "@/data";
import type { AdoptionRequest } from "@/domain/adoptions";

const LOAD_ERROR = "We couldn't load your adoption applications.";

/**
 * Presentation state for the resident's own adoption applications, so they
 * can track review progress from one dedicated screen.
 */
export function useMyAdoptionsViewModel(
  data: AdoptionApplicationDataSource = adoptionApplicationDataSource,
) {
  const [adoptions, setAdoptions] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const records = await data.loadMyApplications();
    setAdoptions(records);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setAdoptions([]);
          setError(cause instanceof Error ? cause.message : LOAD_ERROR);
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
      setError(cause instanceof Error ? cause.message : LOAD_ERROR);
    }
  }, [load]);

  return { adoptions, loading, error, reload };
}
