import { useCallback, useEffect, useState } from "react";

import { authRepository, rescuerHomeDataSource } from "@/data";
import type { Barangay, AuthUser } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";
import {
  selectRescuerHome,
  type RescuerHomeStats,
} from "@/domain/rescuer";
import {
  selectRescuerReportSummary,
  type RescuerReportSummary,
} from "@/domain/rescuer-reports";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  auth?: AuthRepository;
  home?: RescuerHomeDataSource;
}

export interface RescuerProfileState {
  stats: RescuerHomeStats;
  reports: RescuerReportSummary;
  lifetimeRescues: number;
  barangayName: string | null;
}

/**
 * Profile state for the rescuer shell: account details, workload, and the
 * all-time report summary behind the reports banner.
 */
export function useRescuerProfileViewModel({
  auth = authRepository,
  home = rescuerHomeDataSource,
}: Options = {}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<RescuerProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cachedUser, homeData, barangays] = await Promise.all([
      auth.getCachedUser(),
      home.loadHome(),
      auth.loadBarangays().catch<Barangay[]>(() => []),
    ]);

    const reports = selectRescuerReportSummary(homeData.assignments);
    const barangay =
      cachedUser?.barangayId != null
        ? barangays.find((item) => item.id === cachedUser.barangayId)
        : undefined;

    setUser(cachedUser);
    setProfile({
      stats: selectRescuerHome(homeData).stats,
      reports,
      lifetimeRescues: reports.totalCompleted,
      barangayName: barangay?.name ?? null,
    });
    setError(null);
  }, [auth, home]);

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
