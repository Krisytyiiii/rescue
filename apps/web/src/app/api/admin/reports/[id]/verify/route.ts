import { NextResponse } from "next/server";

import { authService, isAppError, reportsService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function POST(
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
    const admin = await authService.me(session.sub);
    const actor: Actor = {
      userId: admin.id,
      role: admin.role,
      barangayId: admin.barangayId,
    };
    const report = await reportsService.verify(id, actor);
    return NextResponse.json({ ok: true, data: { id: report.id, status: report.status } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not verify report" } },
      { status: 500 },
    );
  }
}
