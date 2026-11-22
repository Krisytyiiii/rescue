import type { SessionStorage } from "@/domain/ports";
import type {
  AssignmentStatus,
  ReportSpecies,
  ReportStatus,
  ReportType,
  UrgencyLevel,
} from "@/domain/rescuer";
import type { ReportMapMarker } from "@/domain/report-map";

import { requestJson } from "./http";
import type { ReportMapDataSource } from "./report-map";

/** Same shape as the admin report map (`ReportMarkerRow`). */
interface ReportMapRow {
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
  rescuer: { id: string; fullName: string } | null;
  assignmentStatus: AssignmentStatus | null;
}

interface ReportMapPayload {
  reports: ReportMapRow[];
}

function toMarker(row: ReportMapRow): ReportMapMarker {
  return {
    id: row.reportId,
    reportCode: row.reportCode,
    reportStatus: row.reportStatus,
    assignmentStatus: row.assignmentStatus,
    urgency: row.urgencyLevel,
    species: row.species,
    reportType: row.reportType,
    description: row.description,
    barangay: row.barangay,
    landmark: row.locationLandmark,
    latitude: row.latitude,
    longitude: row.longitude,
    reporter: row.reporter,
    rescuerName: row.rescuer?.fullName ?? null,
    submittedAt: row.submittedAt,
    verifiedAt: row.verifiedAt,
  };
}

/** HTTP implementation of the explore map port. */
export class HttpReportMapDataSource implements ReportMapDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadMarkers(): Promise<ReportMapMarker[]> {
    const stored = await this.session.read();
    const payload = await requestJson<ReportMapPayload>("/api/reports/map", {
      token: stored?.token,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load reports around you.",
    });
    return payload.reports.map(toMarker);
  }
}
