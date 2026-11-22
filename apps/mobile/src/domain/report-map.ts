import type {
  AssignmentStatus,
  ReportSpecies,
  ReportStatus,
  ReportType,
  UrgencyLevel,
} from "./rescuer";

/**
 * One geotagged report on the explore map. Mirrors the admin rescues map
 * (`ReportMarkerRow`) so both surfaces speak the same status vocabulary.
 */
export interface ReportMapMarker {
  id: string;
  reportCode: string;
  reportStatus: ReportStatus;
  assignmentStatus: AssignmentStatus | null;
  urgency: UrgencyLevel;
  species: ReportSpecies;
  reportType: ReportType;
  description: string;
  barangay: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  reporter: string;
  rescuerName: string | null;
  submittedAt: string;
  verifiedAt: string | null;
}

export type ReportStatusFilter = "all" | ReportStatus;

export interface ReportStatusCounts extends Record<ReportStatus, number> {
  total: number;
}

/** Same order as the admin rescues map legend. */
export const REPORT_STATUS_ORDER: readonly ReportStatus[] = [
  "submitted",
  "verified",
  "assigned",
  "in_progress",
  "rescued",
  "unable_to_locate",
  "rejected",
  "closed",
];

/** Same pin colours as the admin rescues map. */
export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; pin: string }
> = {
  submitted: { label: "Submitted", pin: "#c99a4e" },
  verified: { label: "Verified", pin: "#1f7a4d" },
  assigned: { label: "Assigned", pin: "#2f8f63" },
  in_progress: { label: "In progress", pin: "#247a54" },
  rescued: { label: "Rescued", pin: "#15803d" },
  unable_to_locate: { label: "Unable to locate", pin: "#b45309" },
  rejected: { label: "Rejected", pin: "#b42318" },
  closed: { label: "Closed", pin: "#5f7a6b" },
};

export function countReportMarkers(
  markers: readonly ReportMapMarker[],
): ReportStatusCounts {
  const counts: ReportStatusCounts = {
    total: markers.length,
    submitted: 0,
    verified: 0,
    assigned: 0,
    in_progress: 0,
    rescued: 0,
    unable_to_locate: 0,
    rejected: 0,
    closed: 0,
  };

  for (const marker of markers) {
    counts[marker.reportStatus] += 1;
  }

  return counts;
}

export function filterReportMarkers(
  markers: readonly ReportMapMarker[],
  filter: ReportStatusFilter,
): ReportMapMarker[] {
  return filter === "all"
    ? [...markers]
    : markers.filter((marker) => marker.reportStatus === filter);
}
