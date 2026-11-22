import type { RescuerHomeData } from "@/domain/rescuer";

/** Port for the rescuer's today snapshot (`GET /api/rescues/mine`). */
export interface RescuerHomeDataSource {
  loadHome(): Promise<RescuerHomeData>;
}
