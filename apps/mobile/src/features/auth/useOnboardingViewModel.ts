import { useEffect, useRef, useState } from "react";

import { authRepository } from "@/data";
import type { AuthRepository } from "@/domain/ports";

/**
 * Restores a stored session when the intro mounts. If the user is already
 * signed in (or offline with a cached session), `onReturningUser` is called
 * so the screen can route home.
 */
export function useOnboardingViewModel(
  onReturningUser: () => void,
  repository: AuthRepository = authRepository,
) {
  const [checkingSession, setCheckingSession] = useState(true);
  const callbackRef = useRef(onReturningUser);

  useEffect(() => {
    callbackRef.current = onReturningUser;
  }, [onReturningUser]);

  useEffect(() => {
    let active = true;

    repository
      .restoreSession()
      .catch(() => ({ status: "none" as const }))
      .then((result) => {
        if (!active) return;

        if (result.status === "valid" || result.status === "offline") {
          callbackRef.current();
          return;
        }

        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [repository]);

  return { checkingSession };
}
