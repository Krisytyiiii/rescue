import { useEffect, useState } from "react";

import { authRepository } from "@/data";
import type { AuthUser } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";

/** Session state for the signed-in home screen. */
export function useHomeViewModel(repository: AuthRepository = authRepository) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    repository
      .getCachedUser()
      .then((cached) => {
        if (active) setUser(cached);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [repository]);

  const signOut = () => repository.signOut();

  return { user, loading, signOut };
}
