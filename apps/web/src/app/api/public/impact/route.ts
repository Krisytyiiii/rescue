import { NextResponse } from "next/server";

import { prisma } from "@furescue/core";

/** Public, pre-login snapshot for the mobile onboarding slides. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RESCUED_STATUSES = [
  "rescued",
  "under_care",
  "available",
  "adoption_pending",
  "adopted",
  "returned_to_owner",
] as const;

const ACTIVE_REPORT_STATUSES = [
  "verified",
  "assigned",
  "in_progress",
  "rescued",
  "closed",
] as const;

export async function GET() {
  try {
    const [rescued, adopted, inCare, available, latestReport] =
      await Promise.all([
        prisma.animal.count({
          where: {
            deletedAt: null,
            lifecycleStatus: { in: [...RESCUED_STATUSES] },
          },
        }),
        prisma.animal.count({
          where: { deletedAt: null, lifecycleStatus: "adopted" },
        }),
        prisma.animal.count({
          where: {
            deletedAt: null,
            lifecycleStatus: {
              in: ["rescued", "under_care", "available", "adoption_pending"],
            },
          },
        }),
        prisma.animal.count({
          where: {
            deletedAt: null,
            lifecycleStatus: "available",
            listingStatus: "published",
          },
        }),
        prisma.report.findFirst({
          where: {
            deletedAt: null,
            status: { in: [...ACTIVE_REPORT_STATUSES] },
          },
          orderBy: { submittedAt: "desc" },
          select: {
            reportCode: true,
            description: true,
            species: true,
            urgencyLevel: true,
            status: true,
            submittedAt: true,
            barangay: { select: { name: true } },
            statusHistory: {
              orderBy: { changedAt: "asc" },
              select: { newStatus: true, changedAt: true },
            },
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,
      data: {
        stats: { rescued, adopted, inCare, available },
        latestReport: latestReport
          ? {
              code: latestReport.reportCode,
              title: latestReport.description,
              species: latestReport.species,
              urgency: latestReport.urgencyLevel,
              status: latestReport.status,
              barangay: latestReport.barangay?.name ?? null,
              submittedAt: latestReport.submittedAt,
              steps: latestReport.statusHistory.map((entry) => ({
                status: entry.newStatus,
                at: entry.changedAt,
              })),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[public/impact]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Community impact data is unavailable right now.",
        },
      },
      { status: 500 },
    );
  }
}
