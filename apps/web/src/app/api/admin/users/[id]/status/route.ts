import { NextResponse } from "next/server";

import { authService, isAppError, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const ALLOWED_STATUSES = ["active", "suspended", "deactivated"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

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
  const status = body?.status as AllowedStatus | undefined;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Unknown account status" } },
      { status: 400 },
    );
  }

  try {
    const admin = await authService.me(session.sub);
    const actor: Actor = {
      userId: admin.id,
      role: admin.role,
      barangayId: admin.barangayId,
    };
    const user = await authService.setAccountStatus(actor, id, status);
    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not update this account" } },
      { status: 500 },
    );
  }
}
