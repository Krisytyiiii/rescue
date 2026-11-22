import type { AuthUser } from "@/domain/auth";

/** Activity counts shown on the resident profile summary. */
export interface ResidentProfileStats {
  reportsSubmitted: number;
  applications: number;
  interviewsScheduled: number;
  approved: number;
  completed: number;
}

/** Everything the resident profile screen reads from `GET /api/profile/summary`. */
export interface ResidentProfileSnapshot {
  user: AuthUser;
  barangayName: string | null;
  stats: ResidentProfileStats;
}
