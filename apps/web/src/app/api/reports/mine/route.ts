import { NextResponse } from "next/server";

import { isAppError, reportsService } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/reports/mine - the signed-in resident's own reports, newest first.
 * Includes reports flagged as duplicates and the latest status update.
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  try {
    const { items } = await reportsService.list({
      reporterUserId: session.sub,
      includeDuplicates: true,
      page: 1,
      pageSize: 25,
    });

    const reports = items.map((report) => {
      const latest = report.statusHistory[0] ?? null;

      return {
        id: report.id,
        reportCode: report.reportCode,
        reportType: report.reportType,
        species: report.species,
        urgencyLevel: report.urgencyLevel,
        status: report.status,
        description: report.description,
        submittedAt: report.submittedAt.toISOString(),
        barangay: report.barangay?.name ?? null,
        locationLandmark: report.locationLandmark,
        media: report.media.map((item) => ({ fileUrl: item.fileUrl })),
        latestUpdate: latest
          ? {
              status: latest.newStatus,
              remarks: latest.remarks,
              changedAt: latest.changedAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ ok: true, data: { reports } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[reports/mine]", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load your reports" },
      },
      { status: 500 },
    );
  }
}
