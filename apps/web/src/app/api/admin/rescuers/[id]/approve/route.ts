import { NextResponse } from "next/server";

import { authService, isAppError } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function POST(
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

  const { id } = await context.params;

  try {
    const rescuer = await authService.approveRescuer(session.role, id);
    return NextResponse.json({ ok: true, data: rescuer });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not approve rescuer" } },
      { status: 500 },
    );
  }
}
