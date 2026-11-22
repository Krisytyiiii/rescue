import { useCallback, useEffect, useState } from "react";

import {
  authRepository,
  rescuerHistoryDataSource,
  rescuerHomeDataSource,
} from "@/data";
import type { AuthUser } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";
import {
  selectRescuerHistory,
  selectRescuerHome,
  type RescuerHomeStats,
} from "@/domain/rescuer";

import type { RescuerHistoryDataSource } from "@/data/rescuer-history";
import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  auth?: AuthRepository;
  home?: RescuerHomeDataSource;
  history?: RescuerHistoryDataSource;
}

export interface RescuerProfileState {
  stats: RescuerHomeStats;
  lifetimeRescues: number;
}

/**
 * Profile state for the rescuer shell: account details plus the workload
 * numbers the design calls for. Aggregation stays in the domain selectors.
 */
export function useRescuerProfileViewModel({
  auth = authRepository,
  home = rescuerHomeDataSource,
  history = rescuerHistoryDataSource,
}: Options = {}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<RescuerProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cachedUser, homeData, historyEntries] = await Promise.all([
      auth.getCachedUser(),
      home.loadHome(),
      history.loadHistory(),
    ]);

    setUser(cachedUser);
    setProfile({
      stats: selectRescuerHome(homeData).stats,
      lifetimeRescues: selectRescuerHistory(historyEntries).total,
    });
    setError(null);
  }, [auth, home, history]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your workload.");
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
    } catch {
      setError("Couldn't load your workload.");
    }
  }, [load]);

  const signOut = () => auth.signOut();

  return { user, profile, loading, error, reload, signOut };
}
