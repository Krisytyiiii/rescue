import { NextResponse } from "next/server";

import { authService, isAppError, rescuesService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/** GET /api/rescues/mine[?scope=history] - the rescuer's own assignments. */
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

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const scope = new URL(request.url).searchParams.get("scope");
    const data =
      scope === "history"
        ? await rescuesService.rescuerHistory(actor)
        : await rescuesService.rescuerHome(actor);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[rescues/mine]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production" || !(error instanceof Error)
              ? "Could not load assignments"
              : error.message,
        },
      },
      { status: 500 },
    );
  }
}
