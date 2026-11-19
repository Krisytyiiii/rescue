import type { ReportDetail } from "@furescue/core";

import type { ReportCardData } from "./reports-grid";

/** Maps a domain report into the shape rendered by the reports grid. */
export function toReportCardData(report: ReportDetail): ReportCardData {
  const photo = report.media.find((media) => media.mediaType === "photo");
  const rescue = report.rescueOperations[0];

  return {
    id: report.id,
    reportCode: report.reportCode,
    reportType: report.reportType,
    species: report.species,
    description: report.description,
    urgencyLevel: report.urgencyLevel,
    animalCount: report.animalCount,
    status: report.status,
    submittedAt: report.submittedAt.toISOString(),
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    locationLandmark: report.locationLandmark,
    duplicateOfReportId: report.duplicateOfReportId,
    barangay: report.barangay?.name ?? null,
    reporter: report.reporter
      ? `${report.reporter.firstName} ${report.reporter.lastName}`
      : "Anonymous",
    verifier: report.verifier
      ? `${report.verifier.firstName} ${report.verifier.lastName}`
      : null,
    photoUrl: photo?.fileUrl ?? null,
    resultingAnimal: report.resultingAnimal?.animalCode ?? null,
    statusHistory: report.statusHistory.map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      remarks: entry.remarks,
      changedAt: entry.changedAt.toISOString(),
    })),
    rescue: rescue
      ? {
          rescuer: `${rescue.rescuer.firstName} ${rescue.rescuer.lastName}`,
          status: rescue.assignmentStatus,
          assignedAt: rescue.assignedAt.toISOString(),
        }
      : null,
  };
}
