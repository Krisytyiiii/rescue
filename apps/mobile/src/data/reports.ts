import type {
  CreatedReport,
  NewReportInput,
  ReportPhotoUpload,
} from "@/domain/report-submission";

/** Port for submitting a resident report (`POST /api/reports`). */
export interface ReportSubmissionDataSource {
  createReport(input: NewReportInput): Promise<CreatedReport>;
  /** Uploads one photo and returns its public URL. */
  uploadPhoto(photo: ReportPhotoUpload): Promise<string>;
}
