import { useEffect, useState } from "react";

import { onboardingDataSource } from "@/data";
import type { OnboardingDataSource } from "@/data";
import type { OnboardingSnapshot } from "@/domain/onboarding";

/**
 * Loads the public impact snapshot once when the intro mounts. Nothing is
 * injected locally: until the backend answers, `snapshot` stays `null` and the
 * screen shows placeholders rather than invented counts or reports.
 */
export function useOnboardingSnapshot(
  source: OnboardingDataSource = onboardingDataSource,
) {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    source
      .loadSnapshot()
      .then((result) => {
        if (active) setSnapshot(result);
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn("[onboarding] impact snapshot unavailable", error);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [source]);

  return { snapshot, loading };
}
