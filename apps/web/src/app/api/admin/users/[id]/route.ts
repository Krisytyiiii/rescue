import { NextResponse } from "next/server";

import { authService, isAppError } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Admin sign in required" } },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  try {
    const user = await authService.getUserDetail(id);
    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not load this account" } },
      { status: 500 },
    );
  }
}
