import { NextResponse } from "next/server";

import { adoptionsService, authService, isAppError, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/adoptions/available - animals residents can apply to adopt.
 *
 * Returns only published animals currently open for adoption, plus the
 * caller's open application (if any) so the app can prevent duplicates.
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
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };

    const animals = await adoptionsService.listAvailable(actor);

    return NextResponse.json({ ok: true, data: { animals } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[adoptions:available]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not load the adoption animals",
        },
      },
      { status: 500 },
    );
  }
}
