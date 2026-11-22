import type { AuthRepository } from "@/domain/ports";
import type { RescuerAssignmentRepository } from "@/domain/rescuer";

import { HttpAuthGateway } from "./auth-gateway";
import { DefaultAuthRepository } from "./auth-repository";
import { USE_RESCUER_API } from "./config";
import { ExpoGoogleAuthBrowser } from "./google-browser";
import { HttpMessagingGateway } from "./messaging-gateway";
import { reportMapDataSource as mockReportMapDataSource } from "./report-map";
import { HttpRescuerGateway } from "./rescuer-gateway";
import { rescuerHomeDataSource as mockHomeDataSource } from "./rescuer-home";
import { rescuerQueueDataSource as mockQueueDataSource } from "./rescuer-queue";
import { SecureSessionStorage } from "./session-storage";

import type { ReportMapDataSource } from "./report-map";
import type { RescuerHistoryDataSource } from "./rescuer-history";
import type { RescuerHomeDataSource } from "./rescuer-home";
import type { RescuerQueueDataSource } from "./rescuer-queue";

/**
 * Composition root: the only place concrete implementations are wired.
 * View models depend on interfaces; the environment decides mock vs HTTP.
 */
const sessionStorage = new SecureSessionStorage();
const httpRescuerGateway = new HttpRescuerGateway(sessionStorage);
const httpMessagingGateway = new HttpMessagingGateway(sessionStorage);

export const authRepository: AuthRepository = new DefaultAuthRepository(
  new HttpAuthGateway(),
  sessionStorage,
  new ExpoGoogleAuthBrowser(),
);

export const rescuerHomeDataSource: RescuerHomeDataSource = USE_RESCUER_API
  ? httpRescuerGateway
  : mockHomeDataSource;

/**
 * The Assignments board must always reflect real backend records, matching
 * Today. It uses the same `GET /api/rescues/mine` snapshot (every operation
 * owned by the signed-in rescuer, including declined and completed ones).
 */
export const rescuerAssignmentsDataSource: RescuerHomeDataSource =
  httpRescuerGateway;

export const rescuerQueueDataSource: RescuerQueueDataSource = USE_RESCUER_API
  ? httpRescuerGateway
  : mockQueueDataSource;

/**
 * History is backed by the real backend only:
 * `GET /api/rescues/mine?scope=history` (completed, failed, declined).
 */
export const rescuerHistoryDataSource: RescuerHistoryDataSource =
  httpRescuerGateway;

/** Report detail opened from History also reads and writes the real backend. */
export const rescuerAssignmentRepository: RescuerAssignmentRepository =
  httpRescuerGateway;

/** Direct messages from a rescuer to their dispatcher or a reporter. */
export const messagingDataSource = httpMessagingGateway;

/** Explore map markers. Placeholder until `/api/reports/map` exists. */
export const reportMapDataSource: ReportMapDataSource = mockReportMapDataSource;

export { ApiError } from "./http";
export { API_BASE_URL, webUrl } from "./config";
export type { ReportMapDataSource } from "./report-map";
export type { RescuerHomeDataSource } from "./rescuer-home";
export type { RescuerQueueDataSource } from "./rescuer-queue";
export type { RescuerHistoryDataSource } from "./rescuer-history";
export type { MessagingDataSource } from "./messaging-gateway";
