import type { AuthUser } from "@/domain/auth";
import type { SessionStorage } from "@/domain/ports";
import type {
  ResidentProfileSnapshot,
  ResidentProfileStats,
} from "@/domain/resident-profile";

import { requestJson } from "./http";

interface SummaryPayload {
  user: AuthUser;
  barangay: string | null;
  stats: ResidentProfileStats;
}

/** Port for the resident's profile summary. */
export interface ResidentProfileDataSource {
  loadProfile(): Promise<ResidentProfileSnapshot>;
}

/** HTTP implementation of the resident profile summary endpoint. */
export class HttpResidentProfileGateway implements ResidentProfileDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadProfile(): Promise<ResidentProfileSnapshot> {
    const token = (await this.session.read())?.token;
    const payload = await requestJson<SummaryPayload>("/api/profile/summary", {
      token,
      networkMessage: "Can't load your profile. Check your connection.",
      fallbackMessage: "We couldn't load your profile.",
    });

    return {
      user: payload.user,
      barangayName: payload.barangay,
      stats: payload.stats,
    };
  }
}
