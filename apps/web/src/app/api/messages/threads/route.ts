import { NextResponse } from "next/server";

import { authService, isAppError, messagingService, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/**
 * GET /api/messages/threads - the signed-in person's direct threads with the
 * latest message, used to preview and order contacts in the mobile chat list.
 */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (session.role !== "rescuer" && session.role !== "community_user") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Account not allowed to chat" } },
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

    const threads = await messagingService.listMyDirectThreads(actor);

    return NextResponse.json({ ok: true, data: { threads } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages:threads]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Could not load your chats",
        },
      },
      { status: 500 },
    );
  }
}
