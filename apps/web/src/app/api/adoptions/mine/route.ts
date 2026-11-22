import { NextResponse } from "next/server";

import { adoptionsService, authService, isAppError, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const MAX_PAGE_SIZE = 100;

/**
 * GET /api/adoptions/mine - the signed-in resident's own adoption
 * applications, newest first, so they can track review progress.
 */
export async function GET(request: Request) {
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

    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize")) || MAX_PAGE_SIZE),
    );

    const data = await adoptionsService.list({ page, pageSize }, actor);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[adoptions:mine]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not load your adoption applications",
        },
      },
      { status: 500 },
    );
  }
}
