import type { RescuerAssignment } from "@/domain/rescuer";

import { listAssignments } from "./rescuer-store";

/** Port for the rescuer's completed/failed operation history. */
export interface RescuerHistoryDataSource {
  loadHistory(): Promise<RescuerAssignment[]>;
}

/** Placeholder source until `/api/rescues/mine?scope=history` exists. */
export const rescuerHistoryDataSource: RescuerHistoryDataSource = {
  async loadHistory() {
    return listAssignments();
  },
};
