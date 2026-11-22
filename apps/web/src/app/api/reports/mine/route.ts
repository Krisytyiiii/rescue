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
      const operation = report.rescueOperations[0] ?? null;

      const person = (
        user: { id: string; firstName: string; lastName: string } | null,
      ) =>
        user
          ? { id: user.id, name: `${user.firstName} ${user.lastName}`.trim() }
          : null;

      return {
        id: report.id,
        reportCode: report.reportCode,
        reportType: report.reportType,
        species: report.species,
        urgencyLevel: report.urgencyLevel,
        status: report.status,
        description: report.description,
        animalCount: report.animalCount,
        submittedAt: report.submittedAt.toISOString(),
        barangay: report.barangay?.name ?? null,
        locationLandmark: report.locationLandmark,
        latitude: Number(report.latitude),
        longitude: Number(report.longitude),
        media: report.media.map((item) => ({ fileUrl: item.fileUrl })),
        verifiedAt: report.verifiedAt?.toISOString() ?? null,
        verifier: person(report.verifier),
        latestUpdate: latest
          ? {
              status: latest.newStatus,
              remarks: latest.remarks,
              changedAt: latest.changedAt.toISOString(),
            }
          : null,
        statusHistory: report.statusHistory.map((entry) => ({
          status: entry.newStatus,
          previousStatus: entry.oldStatus,
          remarks: entry.remarks,
          changedAt: entry.changedAt.toISOString(),
          changedBy: person(entry.changer),
        })),
        assignment: operation
          ? {
              id: operation.id,
              status: operation.assignmentStatus,
              assignedAt: operation.assignedAt.toISOString(),
              acceptedAt: operation.acceptedAt?.toISOString() ?? null,
              arrivedAt: operation.arrivedAt?.toISOString() ?? null,
              completedAt: operation.completedAt?.toISOString() ?? null,
              outcomeNotes: operation.outcomeNotes,
              animalsRescued: operation.animalsRescued,
              rescuer: person(operation.rescuer),
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
