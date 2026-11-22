import type { AuthRepository } from "@/domain/ports";
import type { RescuerAssignmentRepository } from "@/domain/rescuer";

import { HttpAnimalsGateway } from "./animals-gateway";
import { HttpAuthGateway } from "./auth-gateway";
import { DefaultAuthRepository } from "./auth-repository";
import { ExpoGoogleAuthBrowser } from "./google-browser";
import { HttpMessagingGateway } from "./messaging-gateway";
import { HttpReportMapDataSource } from "./report-map-gateway";
import { HttpRescuerGateway } from "./rescuer-gateway";
import { SecureSessionStorage } from "./session-storage";

import type { AnimalsDataSource } from "./animals";
import type { ReportMapDataSource } from "./report-map";
import type { RescuerHistoryDataSource } from "./rescuer-history";
import type { RescuerHomeDataSource } from "./rescuer-home";
import type { RescuerQueueDataSource } from "./rescuer-queue";

/**
 * Composition root: the only place concrete implementations are wired.
 * View models depend on interfaces; every source is backed by the live API.
 */
const sessionStorage = new SecureSessionStorage();
const httpRescuerGateway = new HttpRescuerGateway(sessionStorage);
const httpAnimalsGateway = new HttpAnimalsGateway(sessionStorage);
const httpMessagingGateway = new HttpMessagingGateway(sessionStorage);
const httpReportMapDataSource = new HttpReportMapDataSource(sessionStorage);

export const authRepository: AuthRepository = new DefaultAuthRepository(
  new HttpAuthGateway(),
  sessionStorage,
  new ExpoGoogleAuthBrowser(),
);

/** Today snapshot: `GET /api/rescues/mine`. */
export const rescuerHomeDataSource: RescuerHomeDataSource = httpRescuerGateway;

/**
 * The Assignments board must always reflect real backend records, matching
 * Today. It uses the same `GET /api/rescues/mine` snapshot (every operation
 * owned by the signed-in rescuer, including declined and completed ones).
 */
export const rescuerAssignmentsDataSource: RescuerHomeDataSource =
  httpRescuerGateway;

/** Verified queue: `GET /api/reports?status=verified`. */
export const rescuerQueueDataSource: RescuerQueueDataSource = httpRescuerGateway;

/**
 * History is backed by the real backend only:
 * `GET /api/rescues/mine?scope=history` (completed, failed, declined).
 */
export const rescuerHistoryDataSource: RescuerHistoryDataSource =
  httpRescuerGateway;

/** Report detail opened from History also reads and writes the real backend. */
export const rescuerAssignmentRepository: RescuerAssignmentRepository =
  httpRescuerGateway;

/** Read-only animal records shown in the rescuer Animals screen. */
export const animalsDataSource: AnimalsDataSource = httpAnimalsGateway;

/** Direct messages from a rescuer to their dispatcher or a reporter. */
export const messagingDataSource = httpMessagingGateway;

/** Explore map markers: live report coordinates from `GET /api/reports/map`. */
export const reportMapDataSource: ReportMapDataSource = httpReportMapDataSource;

export { ApiError } from "./http";
export { API_BASE_URL, webUrl } from "./config";
export type { AnimalsDataSource } from "./animals";
export type { ReportMapDataSource } from "./report-map";
export type { RescuerHomeDataSource } from "./rescuer-home";
export type { RescuerQueueDataSource } from "./rescuer-queue";
export type { RescuerHistoryDataSource } from "./rescuer-history";
export type { MessagingDataSource } from "./messaging-gateway";
