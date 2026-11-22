import { NextResponse } from "next/server";

import {
  animalsService,
  authService,
  isAppError,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const MAX_PAGE_SIZE = 100;

/**
 * GET /api/animals - read-only animal records for staff.
 *
 * Rescuers use this from the mobile Animals screen. It intentionally exposes
 * no mutation endpoints: care records are maintained in the admin console.
 */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (session.role !== "rescuer" && session.role !== "admin") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: "Staff account required" },
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

    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize")) || MAX_PAGE_SIZE),
    );

    const data = await animalsService.list({ page, pageSize }, actor);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[animals]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production" || !(error instanceof Error)
              ? "Could not load animals"
              : error.message,
        },
      },
      { status: 500 },
    );
  }
}
