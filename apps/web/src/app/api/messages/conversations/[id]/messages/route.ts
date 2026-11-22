import { NextResponse } from "next/server";

import {
  authService,
  isAppError,
  messagingService,
  sendMessageSchema,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

/** POST /api/messages/conversations/:id/messages - rescuer reply. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
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

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: parsed.error.issues[0]?.message ?? "Write a message before sending",
        },
      },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const message = await messagingService.sendAsRescuer(id, parsed.data, actor);
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages/conversations/:id/messages]", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not send that message" } },
      { status: 500 },
    );
  }
}
