import { NextResponse } from "next/server";

import {
  authService,
  isAppError,
  rescuesService,
  type Actor,
  type RescuerFieldAction,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

const ACTIONS: readonly RescuerFieldAction[] = [
  "accept",
  "decline",
  "start_en_route",
  "mark_on_site",
  "complete",
  "fail",
];

/** POST /api/rescues/:id/:action - rescuer field actions. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
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

  const { id, action } = await context.params;
  if (!ACTIONS.includes(action as RescuerFieldAction)) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Unknown action" } },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const assignment = await rescuesService.rescuerTransition(
      id,
      action as RescuerFieldAction,
      actor,
      {
        reason: typeof body?.reason === "string" ? body.reason : undefined,
        outcomeNotes:
          typeof body?.outcomeNotes === "string" ? body.outcomeNotes : undefined,
        animalsRescued:
          typeof body?.animalsRescued === "number" ? body.animalsRescued : undefined,
      },
    );
    return NextResponse.json({ ok: true, data: assignment });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not save that action" } },
      { status: 500 },
    );
  }
}
