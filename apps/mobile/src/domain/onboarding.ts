/**
 * Public onboarding facts. Mirrors the serialized `GET /api/public/impact`
 * payload so the intro slides never render invented numbers or reports.
 */

export interface OnboardingStats {
  /** Animals that have entered rescue care (everything past `reported`). */
  rescued: number;
  /** Animals with lifecycle status `adopted`. */
  adopted: number;
  /** Animals currently rescued, under care, or awaiting adoption. */
  inCare: number;
  /** Published animals that are available right now. */
  available: number;
}

export interface OnboardingReportStep {
  status: string;
  at: string;
}

export interface OnboardingReport {
  code: string;
  title: string;
  species: string;
  urgency: string;
  status: string;
  barangay: string | null;
  submittedAt: string;
  steps: OnboardingReportStep[];
}

export interface OnboardingSnapshot {
  stats: OnboardingStats;
  latestReport: OnboardingReport | null;
}
