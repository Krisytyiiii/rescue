import type { AdoptionRequest } from "@/domain/adoptions";

/** Port for the read-only adoption applications (`GET /api/adoptions`). */
export interface AdoptionsDataSource {
  loadAdoptions(): Promise<AdoptionRequest[]>;
}
