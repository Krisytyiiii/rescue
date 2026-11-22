import { NextResponse } from "next/server";

import {
  adoptionsService,
  authService,
  isAppError,
  prisma,
  reportsService,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/profile/summary - the signed-in resident's profile header plus the
 * activity counts shown on the mobile profile screen.
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (session.role !== "community_user") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: "Resident account required" },
      },
      { status: 403 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };

    const [reportPage, applicationPage, barangay] = await Promise.all([
      reportsService.list({
        reporterUserId: session.sub,
        includeDuplicates: true,
        page: 1,
        pageSize: 1,
      }),
      adoptionsService.list({ page: 1, pageSize: 100 }, actor),
      user.barangayId != null
        ? prisma.barangay.findUnique({
            where: { id: user.barangayId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);

    const statuses = applicationPage.items.map((item) => item.status);
    const count = (...wanted: string[]) =>
      statuses.filter((status) => wanted.includes(status)).length;

    return NextResponse.json({
      ok: true,
      data: {
        user,
        barangay: barangay?.name ?? null,
        stats: {
          reportsSubmitted: reportPage.meta.total,
          applications: applicationPage.meta.total,
          interviewsScheduled: count("interview_scheduled"),
          approved: count("approved", "completed"),
          completed: count("completed"),
        },
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[profile:summary]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not load your profile",
        },
      },
      { status: 500 },
    );
  }
}
