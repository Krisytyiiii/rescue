import type { OnboardingSnapshot } from "@/domain/onboarding";

/** Port for the public impact snapshot shown on the intro slides. */
export interface OnboardingDataSource {
  loadSnapshot(): Promise<OnboardingSnapshot>;
}
