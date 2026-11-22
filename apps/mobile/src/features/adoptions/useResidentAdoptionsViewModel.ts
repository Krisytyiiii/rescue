import { useCallback, useEffect, useState } from "react";

import { adoptionApplicationDataSource } from "@/data";
import type { AdoptionApplicationDataSource } from "@/data";
import type {
  AdoptableAnimal,
  AdoptionApplicationInput,
  AdoptionIdUpload,
} from "@/domain/adoption-applications";

const LOAD_ERROR = "We couldn't load the adoption animals.";

/**
 * Presentation state for the resident adoption listing: loads adoptable
 * animals and submits applications through the adoption port.
 */
export function useResidentAdoptionsViewModel(
  data: AdoptionApplicationDataSource = adoptionApplicationDataSource,
) {
  const [animals, setAnimals] = useState<AdoptableAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await data.loadAvailableAnimals();
    setAnimals(items);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setAnimals([]);
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

  const uploadValidId = useCallback(
    (photo: AdoptionIdUpload) => data.uploadValidId(photo),
    [data],
  );

  const apply = useCallback(
    async (input: AdoptionApplicationInput): Promise<boolean> => {
      setSubmitting(true);
      setSubmitError(null);
      setNotice(null);

      try {
        const created = await data.apply(input);
        setAnimals((current) =>
          current.map((animal) =>
            animal.id === input.animalId
              ? {
                  ...animal,
                  application: {
                    id: created.id,
                    requestCode: created.requestCode,
                    status: "submitted",
                  },
                }
              : animal,
          ),
        );
        setNotice(
          `Application ${created.requestCode} submitted. The City Vet team will review it and reach out for the next steps.`,
        );
        return true;
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "We couldn't submit your adoption application.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [data],
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    animals,
    loading,
    error,
    reload,
    submitting,
    submitError,
    notice,
    clearNotice,
    uploadValidId,
    apply,
  };
}
