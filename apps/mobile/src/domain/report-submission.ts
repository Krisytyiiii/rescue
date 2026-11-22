/**
 * Resident street-animal report. Mirrors `POST /api/reports` and the shared
 * `createReportSchema` in core.
 */

export const REPORT_TYPES = ["stray", "injured", "abandoned"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_SPECIES = ["dog", "cat", "unknown"] as const;
export type ReportSpecies = (typeof REPORT_SPECIES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export interface Coordinates {
  latitude: number;
  longitude: number;
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
}

export interface CreatedReport {
  id: string;
  reportCode: string;
  status: string;
}
