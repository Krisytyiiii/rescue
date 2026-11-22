import type { QueuedReport } from "@/domain/rescuer";

import { listQueuedReports } from "./rescuer-store";

/** Port for the read-only verified-report queue. */
export interface RescuerQueueDataSource {
  loadQueue(): Promise<QueuedReport[]>;
}

/** Placeholder source until `/api/reports?status=verified` is exposed. */
export const rescuerQueueDataSource: RescuerQueueDataSource = {
  async loadQueue() {
    return listQueuedReports();
  },
};
