import { NextResponse } from "next/server";

import {
  adoptionsService,
  authService,
  isAppError,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const MAX_PAGE_SIZE = 100;

/**
 * GET /api/adoptions - read-only adoption applications for staff.
 *
 * Used by the mobile rescuer Adoption screen. Rescuers can read every request
 * and its records but cannot review, approve, or complete anything here.
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

    const data = await adoptionsService.listForStaff({ page, pageSize }, actor);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[adoptions]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production" || !(error instanceof Error)
              ? "Could not load adoptions"
              : error.message,
        },
      },
      { status: 500 },
    );
  }
}
