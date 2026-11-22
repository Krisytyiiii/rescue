import type { SessionStorage } from "@/domain/ports";
import type { CreatedReport, NewReportInput } from "@/domain/report-submission";

import { requestJson } from "./http";
import type { ReportSubmissionDataSource } from "./reports";

/** HTTP implementation of the resident report port. */
export class HttpReportsGateway implements ReportSubmissionDataSource {
  constructor(private readonly session: SessionStorage) {}

  async createReport(input: NewReportInput): Promise<CreatedReport> {
    const token = (await this.session.read())?.token;

    return requestJson<CreatedReport>("/api/reports", {
      method: "POST",
      token,
      body: input,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't submit your report.",
    });
  }
}
