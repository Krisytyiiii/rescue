import type { OnboardingSnapshot } from "@/domain/onboarding";

import { requestJson } from "./http";
import type { OnboardingDataSource } from "./onboarding";

/** Reads the public, pre-login impact snapshot from the live backend. */
export class HttpOnboardingGateway implements OnboardingDataSource {
  async loadSnapshot(): Promise<OnboardingSnapshot> {
    return requestJson<OnboardingSnapshot>("/api/public/impact", {
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load community updates.",
    });
  }
}
