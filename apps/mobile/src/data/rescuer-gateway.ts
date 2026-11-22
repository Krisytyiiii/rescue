import type { SessionStorage } from "@/domain/ports";
import type {
  AssignmentTransition,
  QueuedReport,
  RescuerAssignment,
  RescuerAssignmentRepository,
  RescuerHomeData,
} from "@/domain/rescuer";

import type { RescuerHistoryDataSource } from "./rescuer-history";
import type { RescuerHomeDataSource } from "./rescuer-home";
import type { RescuerQueueDataSource } from "./rescuer-queue";
import { requestJson } from "./http";

interface HomePayload {
  asOf: string;
  assignments: RescuerAssignment[];
  unreadNotifications: number;
  unreadMessages: number;
  queueCount: number;
}

interface QueuePayload {
  reports: QueuedReport[];
}

interface HistoryPayload {
  assignments: RescuerAssignment[];
}

const TRANSITION_PATH: Record<AssignmentTransition["action"], string> = {
  accept: "accept",
  decline: "decline",
  start_en_route: "start_en_route",
  mark_on_site: "mark_on_site",
  complete: "complete",
  fail: "fail",
};

/**
 * HTTP implementation of the rescuer ports. Assumes the planned endpoints:
 *
 *   GET  /api/rescues/mine
 *   GET  /api/rescues/mine?scope=history
 *   GET  /api/rescues/:id
 *   POST /api/rescues/:id/{accept|decline|start_en_route|mark_on_site|complete|fail}
 *   GET  /api/reports?status=verified
 */
export class HttpRescuerGateway
  implements
    RescuerHomeDataSource,
    RescuerAssignmentRepository,
    RescuerQueueDataSource,
    RescuerHistoryDataSource
{
  constructor(private readonly session: SessionStorage) {}

  private async token(): Promise<string | undefined> {
    const stored = await this.session.read();
    return stored?.token;
  }

  async loadHome(): Promise<RescuerHomeData> {
    return requestJson<HomePayload>("/api/rescues/mine", {
      token: await this.token(),
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load your shift.",
    });
  }

  async loadHistory(): Promise<RescuerAssignment[]> {
    const payload = await requestJson<HistoryPayload>(
      "/api/rescues/mine?scope=history",
      {
        token: await this.token(),
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load your rescue history.",
      },
    );
    return payload.assignments;
  }

  async loadQueue(): Promise<QueuedReport[]> {
    const payload = await requestJson<QueuePayload>(
      "/api/reports?status=verified",
      {
        token: await this.token(),
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load the queue.",
      },
    );
    return payload.reports;
  }

  async loadAssignment(id: string): Promise<RescuerAssignment | null> {
    return requestJson<RescuerAssignment>(`/api/rescues/${id}`, {
      token: await this.token(),
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load this assignment.",
    });
  }

  async transition(
    id: string,
    transition: AssignmentTransition,
  ): Promise<RescuerAssignment> {
    return requestJson<RescuerAssignment>(
      `/api/rescues/${id}/${TRANSITION_PATH[transition.action]}`,
      {
        method: "POST",
        body: transition,
        token: await this.token(),
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't save that action.",
      },
    );
  }
}
