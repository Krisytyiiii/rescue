import type { RescuerAssignment } from "@/domain/rescuer";

/** Port for the rescuer's completed/failed operation history. */
export interface RescuerHistoryDataSource {
  loadHistory(): Promise<RescuerAssignment[]>;
}
