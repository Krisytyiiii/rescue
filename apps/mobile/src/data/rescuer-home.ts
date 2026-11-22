import type { RescuerHomeData } from "@/domain/rescuer";

import { listAssignments } from "./rescuer-store";

/**
 * Rescuer home data port. Screens and the view model depend on this
 * abstraction (DIP), so the placeholder source can be swapped for a real HTTP
 * gateway without touching the UI.
 */
export interface RescuerHomeDataSource {
  loadHome(): Promise<RescuerHomeData>;
}

/** Placeholder source until `/api/rescues/mine` exists in the data layer. */
export const rescuerHomeDataSource: RescuerHomeDataSource = {
  async loadHome() {
    return {
      asOf: new Date().toISOString(),
      assignments: listAssignments(),
      unreadNotifications: 3,
      unreadMessages: 2,
      queueCount: 7,
    };
  },
};
