/**
 * Resident street-animal report. Mirrors `POST /api/reports` and the shared
 * `createReportSchema` in core.
 */

import type { AssignmentStatus, ReportStatus } from "./rescuer";

export const REPORT_TYPES = ["stray", "injured", "abandoned"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_SPECIES = ["dog", "cat", "unknown"] as const;
export type ReportSpecies = (typeof REPORT_SPECIES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const MAX_REPORT_PHOTOS = 4;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** A local photo selected on the device, before it is uploaded. */
export interface ReportPhotoUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

/** One uploaded photo attached to a report. */
export interface ReportMedia {
  mediaType: "photo";
  fileUrl: string;
  fileSizeKb?: number;
}

export interface NewReportInput {
  reportType: ReportType;
  species: ReportSpecies;
  description: string;
  urgencyLevel: UrgencyLevel;
  animalCount: number;
  latitude: number;
  longitude: number;
  barangayId?: number;
  locationLandmark?: string;
  media?: ReportMedia[];
}

export interface CreatedReport {
  id: string;
  reportCode: string;
  status: string;
}

export interface ReportStatusUpdate {
  status: ReportStatus;
  remarks: string | null;
  changedAt: string;
}

/** A resident-facing person reference (verifier, dispatcher, rescuer). */
export interface ReportPerson {
  id: string;
  name: string;
}

/** One entry in the report's lifecycle trail. */
export interface ReportTimelineEvent {
  status: ReportStatus;
  previousStatus: string | null;
  remarks: string | null;
  changedAt: string;
  changedBy: ReportPerson | null;
}

/** The rescue operation attached once a dispatcher assigns the report. */
export interface ReportAssignmentInfo {
  id: string;
  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  outcomeNotes: string | null;
  animalsRescued: number | null;
  rescuer: ReportPerson | null;
}

/** One of the resident's own reports, shown in the report history. */
export interface MyReport {
  id: string;
  reportCode: string;
  reportType: ReportType;
  species: ReportSpecies;
  urgencyLevel: UrgencyLevel;
  status: ReportStatus;
  description: string;
  animalCount: number;
  submittedAt: string;
  barangay: string | null;
  locationLandmark: string | null;
  latitude: number;
  longitude: number;
  media: Array<{ fileUrl: string }>;
  verifiedAt: string | null;
  verifier: ReportPerson | null;
  latestUpdate: ReportStatusUpdate | null;
  statusHistory: ReportTimelineEvent[];
  assignment: ReportAssignmentInfo | null;
}
