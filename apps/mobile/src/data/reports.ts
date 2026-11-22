import type { CreatedReport, NewReportInput } from "@/domain/report-submission";

/** Port for submitting a resident report (`POST /api/reports`). */
export interface ReportSubmissionDataSource {
  createReport(input: NewReportInput): Promise<CreatedReport>;
}
