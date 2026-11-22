import { useCallback, useEffect, useState } from "react";

import { animalsDataSource } from "@/data";
import type { AnimalsDataSource } from "@/data";
import type { Animal } from "@/domain/animals";

interface AnimalsOptions {
  data?: AnimalsDataSource;
}

/**
 * Presentation state for the read-only Animals screen. All loading and error
 * handling stays here so the view only renders what it is given.
 */
export function useAnimalsViewModel({ data = animalsDataSource }: AnimalsOptions = {}) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const records = await data.loadAnimals();
    setAnimals(records);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setAnimals([]);
          setError(
            cause instanceof Error ? cause.message : "Couldn't load the animals.",
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
      // Keep the last good list; the error only replaces the empty state.
      setError(
        cause instanceof Error ? cause.message : "Couldn't load the animals.",
      );
    }
  }, [load]);

  return { animals, loading, error, reload };
}
