import type {
  AssignmentStatus,
  ReportSpecies,
  ReportStatus,
  ReportType,
  UrgencyLevel,
} from "../../generated/prisma/enums.ts";

export interface RescueOperationRow {
  id: string;
  reportId: string;
  reportCode: string;
  reportType: ReportType;
  reportStatus: ReportStatus;
  species: ReportSpecies;
  urgencyLevel: UrgencyLevel;
  description: string;
  barangay: string | null;
  locationLandmark: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  reporter: string;
  rescuer: { id: string; fullName: string } | null;
  assignedBy: string | null;
  assignmentStatus: AssignmentStatus;
  assignedAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  outcomeNotes: string | null;
  animalsRescued: number | null;
  resultingAnimal: { id: string; animalCode: string } | null;
  statusHistory: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    remarks: string | null;
    changedAt: string;
    changedBy: string | null;
  }>;
}

export interface UnassignedReportRow {
  reportId: string;
  reportCode: string;
  reportType: ReportType;
  species: ReportSpecies;
  urgencyLevel: UrgencyLevel;
  description: string;
  barangay: string | null;
  locationLandmark: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  reporter: string;
  submittedAt: string;
  verifiedAt: string | null;
}

export interface RescuerWorkloadRow {
  id: string;
  fullName: string;
  openCount: number;
}

/** Mobile-facing assignment row (Today, detail, history). */
export interface RescuerAssignmentRow {
  id: string;
  reportId: string;
  reportCode: string;
  status: AssignmentStatus;
  reportStatus: ReportStatus;
  urgency: UrgencyLevel;
  species: ReportSpecies;
  reportType: ReportType;
  description: string;
  barangay: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  reporter: string;
  reporterProfilePhotoUrl: string | null;
  assignedBy: string | null;
  assignedByProfilePhotoUrl: string | null;
  reporterUserId: string | null;
  assignedByUserId: string | null;
  distanceKm: number | null;
  assignedAt: string;
  completedAt: string | null;
  nextAction:
    | "accept"
    | "decline"
    | "start_en_route"
    | "mark_on_site"
    | "complete"
    | null;
}

export interface RescuerHomePayload {
  asOf: string;
  assignments: RescuerAssignmentRow[];
  unreadNotifications: number;
  unreadMessages: number;
  queueCount: number;
}

export interface RescuerQueuePayload {
  reports: Array<{
    id: string;
    reportCode: string;
    reportStatus: ReportStatus;
    reportType: ReportType;
    species: ReportSpecies;
    urgency: UrgencyLevel;
    description: string;
    barangay: string | null;
    landmark: string | null;
    distanceKm: number | null;
    submittedAt: string;
    verifiedAt: string | null;
  }>;
}

export interface RescuerHistoryPayload {
  assignments: RescuerAssignmentRow[];
}

export interface RescueConsoleCounts {
  unassigned: number;
  pending: number;
  inField: number;
  completed: number;
  issues: number;
  completedToday: number;
  total: number;
}

export interface RescueFeedEntry {
  id: string;
  kind: "assigned" | "accepted" | "arrived" | "completed" | "failed" | "declined";
  reportId: string;
  reportCode: string;
  actor: string;
  at: string;
}

export interface ReportMarkerRow {
  reportId: string;
  reportCode: string;
  reportStatus: ReportStatus;
  reportType: ReportType;
  species: ReportSpecies;
  urgencyLevel: UrgencyLevel;
  description: string;
  barangay: string | null;
  locationLandmark: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  reporter: string;
  submittedAt: string;
  verifiedAt: string | null;
  rescuer: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
  } | null;
  assignmentStatus: AssignmentStatus | null;
  statusHistory: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    remarks: string | null;
    changedAt: string;
    changedBy: string | null;
  }>;
}

export type ReportStatusCounts = Record<ReportStatus, number> & { total: number };

export interface RescueConsoleData {
  reports: ReportMarkerRow[];
  reportCounts: ReportStatusCounts;
  operations: RescueOperationRow[];
  unassigned: UnassignedReportRow[];
  workload: RescuerWorkloadRow[];
  counts: RescueConsoleCounts;
  feed: RescueFeedEntry[];
}
