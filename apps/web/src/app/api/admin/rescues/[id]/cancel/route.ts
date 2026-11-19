import { NextResponse } from "next/server";

import { authService, isAppError, rescuesService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function POST(
  request: Request,
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
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : undefined;

  try {
    const admin = await authService.me(session.sub);
    const actor: Actor = {
      userId: admin.id,
      role: admin.role,
      barangayId: admin.barangayId,
    };
    await rescuesService.cancel(id, actor, reason);
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not cancel this assignment" } },
      { status: 500 },
    );
  }
}
