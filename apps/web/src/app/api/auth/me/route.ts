import { NextResponse } from "next/server";

import { authService, isAppError } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to continue" } },
      { status: 401 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/me]", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "We couldn't load your account." },
      },
      { status: 500 },
    );
  }
}
