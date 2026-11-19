import { NextResponse } from "next/server";
import { z } from "zod";

import { authService, isAppError, reportsService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const payloadSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

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

  let reason: string;
  try {
    const body = await request.json();
    reason = payloadSchema.parse(body).reason;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "A rejection reason is required" } },
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
    const report = await reportsService.reject(id, actor, reason);
    return NextResponse.json({ ok: true, data: { id: report.id, status: report.status } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not reject report" } },
      { status: 500 },
    );
  }
}
