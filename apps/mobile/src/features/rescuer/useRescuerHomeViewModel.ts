import { useCallback, useEffect, useState } from "react";

import { authRepository, rescuerHomeDataSource } from "@/data";
import type { AuthUser } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";
import {
  selectRescuerHome,
  type RescuerHomeData,
  type RescuerHomeState,
} from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface RescuerHomeOptions {
  auth?: AuthRepository;
  data?: RescuerHomeDataSource;
}

/**
 * Presentation state for the rescuer Today screen. All grouping and counts
 * live in the pure `selectRescuerHome` selector, so the view stays dumb.
 */
export function useRescuerHomeViewModel({
  auth = authRepository,
  data = rescuerHomeDataSource,
}: RescuerHomeOptions = {}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [home, setHome] = useState<RescuerHomeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cachedUser, loaded]: [AuthUser | null, RescuerHomeData] =
      await Promise.all([auth.getCachedUser(), data.loadHome()]);
    setUser(cachedUser);
    setHome(selectRescuerHome(loaded));
    setError(null);
  }, [auth, data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setHome(null);
          setError(
            cause instanceof Error ? cause.message : "Couldn't load your shift.",
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
      // Keep the last good state; error text only appears on first load.
      setError(
        cause instanceof Error ? cause.message : "Couldn't load your shift.",
      );
    }
  }, [load]);

  const firstName = user?.firstName?.trim() || "rescuer";
  const signOut = () => auth.signOut();

  return {
    firstName,
    home,
    loading,
    error,
    reload,
    signOut,
  };
}
