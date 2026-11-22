import type { AuthRepository } from "@/domain/ports";
import type { RescuerAssignmentRepository } from "@/domain/rescuer";

import { HttpAdoptionApplicationsGateway } from "./adoption-applications-gateway";
import { HttpAdoptionsGateway } from "./adoptions-gateway";
import { HttpAnimalsGateway } from "./animals-gateway";
import { HttpAuthGateway } from "./auth-gateway";
import { DefaultAuthRepository } from "./auth-repository";
import { HttpCommunityGateway } from "./community-gateway";
import { ExpoGoogleAuthBrowser } from "./google-browser";
import { HttpMessagingGateway } from "./messaging-gateway";
import { HttpOnboardingGateway } from "./onboarding-gateway";
import { HttpReportMapDataSource } from "./report-map-gateway";
import { HttpReportsGateway } from "./reports-gateway";
import { HttpRescuerGateway } from "./rescuer-gateway";
import { SecureSessionStorage } from "./session-storage";

import type { AdoptionApplicationDataSource } from "./adoption-applications";
import type { AdoptionsDataSource } from "./adoptions";
import type { AnimalsDataSource } from "./animals";
import type { CommunityDataSource } from "./community";
import type { ResidentContactsDataSource } from "./messaging-gateway";
import type { OnboardingDataSource } from "./onboarding";
import type { ReportMapDataSource } from "./report-map";
import type {
  ReportHistoryDataSource,
  ReportSubmissionDataSource,
} from "./reports";
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
const httpAdoptionsGateway = new HttpAdoptionsGateway(sessionStorage);
const httpCommunityGateway = new HttpCommunityGateway(sessionStorage);
const httpAdoptionApplicationsGateway = new HttpAdoptionApplicationsGateway(
  sessionStorage,
  httpCommunityGateway,
);
const httpMessagingGateway = new HttpMessagingGateway(sessionStorage);
const httpReportMapDataSource = new HttpReportMapDataSource(sessionStorage);
const httpOnboardingGateway = new HttpOnboardingGateway();
const httpReportsGateway = new HttpReportsGateway(sessionStorage);

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

/** Read-only adoption applications shown in the rescuer Adoption screen. */
export const adoptionsDataSource: AdoptionsDataSource = httpAdoptionsGateway;

/** Resident adoption listing and application flow. */
export const adoptionApplicationDataSource: AdoptionApplicationDataSource =
  httpAdoptionApplicationsGateway;

/** Resident community adoption feed: published posts plus your own pending. */
export const communityDataSource: CommunityDataSource = httpCommunityGateway;

/** Direct messages from a rescuer to their dispatcher or a reporter. */
export const messagingDataSource = httpMessagingGateway;

/** Resident chat contacts: the City Vet team and assigned rescuers. */
export const residentContactsDataSource: ResidentContactsDataSource =
  httpMessagingGateway;

/** Explore map markers: live report coordinates from `GET /api/reports/map`. */
export const reportMapDataSource: ReportMapDataSource = httpReportMapDataSource;

/** Intro slides: real impact counts and latest report from `GET /api/public/impact`. */
export const onboardingDataSource: OnboardingDataSource = httpOnboardingGateway;

/** Resident reporting: real submissions through `POST /api/reports`. */
export const reportSubmissionDataSource: ReportSubmissionDataSource =
  httpReportsGateway;

/** Resident report history: `GET /api/reports/mine`. */
export const reportHistoryDataSource: ReportHistoryDataSource =
  httpReportsGateway;

export { ApiError } from "./http";
export { API_BASE_URL, webUrl } from "./config";
export type { AdoptionApplicationDataSource } from "./adoption-applications";
export type { AdoptionsDataSource } from "./adoptions";
export type { AnimalsDataSource } from "./animals";
export type { CommunityDataSource } from "./community";
export type { OnboardingDataSource } from "./onboarding";
export type { ReportMapDataSource } from "./report-map";
export type {
  ReportHistoryDataSource,
  ReportSubmissionDataSource,
} from "./reports";
export type { RescuerHomeDataSource } from "./rescuer-home";
export type { RescuerQueueDataSource } from "./rescuer-queue";
export type { RescuerHistoryDataSource } from "./rescuer-history";
export type {
  MessagingDataSource,
  ResidentContactsDataSource,
} from "./messaging-gateway";
