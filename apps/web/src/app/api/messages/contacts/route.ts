import { NextResponse } from "next/server";

import { authService, isAppError, messagingService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/messages/contacts - people the signed-in resident can message:
 * the City Vet team and the rescuer assigned to each of their reports.
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (session.role !== "community_user") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Resident account required" } },
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

    const contacts = await messagingService.listResidentContacts(actor);

    return NextResponse.json({ ok: true, data: { contacts } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages/contacts]", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not load your contacts" },
      },
      { status: 500 },
    );
  }
}
