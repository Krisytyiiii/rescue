import { NextResponse } from "next/server";

import { authService, isAppError, rescuesService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/** GET /api/rescues/:id - one assignment owned by the signed-in rescuer. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const assignment = await rescuesService.rescuerAssignment(id, actor);
    return NextResponse.json({ ok: true, data: assignment });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not load this assignment" } },
      { status: 500 },
    );
  }
}
