import { useCallback, useEffect, useState } from "react";

import { authRepository, residentProfileDataSource } from "@/data";
import type { ResidentProfileDataSource } from "@/data/resident-profile";
import type { AuthRepository } from "@/domain/ports";
import type {
  ResidentProfileSnapshot,
  ResidentProfileStats,
} from "@/domain/resident-profile";

interface Options {
  auth?: AuthRepository;
  profile?: ResidentProfileDataSource;
}

const EMPTY_STATS: ResidentProfileStats = {
  reportsSubmitted: 0,
  applications: 0,
  interviewsScheduled: 0,
  approved: 0,
  completed: 0,
};

/**
 * Profile state for the resident shell: account details from the backend plus
 * the report and adoption activity that feeds the summary banner.
 */
export function useResidentProfileViewModel({
  auth = authRepository,
  profile = residentProfileDataSource,
}: Options = {}) {
  const [snapshot, setSnapshot] = useState<ResidentProfileSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await profile.loadProfile();
    setSnapshot(data);
    setError(null);
  }, [profile]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your profile.");
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
      setError("Couldn't load your profile.");
    }
  }, [load]);

  const signOut = () => auth.signOut();

  return {
    user: snapshot?.user ?? null,
    stats: snapshot?.stats ?? EMPTY_STATS,
    barangayName: snapshot?.barangayName ?? null,
    loading,
    error,
    reload,
    signOut,
  };
}
