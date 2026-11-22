import { NextResponse } from "next/server";

import { authService, isAppError, rescuesService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/reports?status=verified - read-only verified queue for rescuers.
 * Only the verified scope is exposed here; admins use /api/admin/reports.
 */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (session.role !== "rescuer") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Rescuer account required" } },
      { status: 403 },
    );
  }

  const status = new URL(request.url).searchParams.get("status");
  if (status !== "verified") {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Only status=verified is supported" } },
      { status: 400 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const data = await rescuesService.rescuerQueue(actor);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not load the queue" } },
      { status: 500 },
    );
  }
}
