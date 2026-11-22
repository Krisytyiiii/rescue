import type { QueuedReport } from "@/domain/rescuer";

/** Port for the verified-report queue (`GET /api/reports?status=verified`). */
export interface RescuerQueueDataSource {
  loadQueue(): Promise<QueuedReport[]>;
}
