import { NextResponse } from "next/server";

import {
  authService,
  isAppError,
  messagingService,
  startConversationSchema,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/** GET /api/messages/direct?userId=... - the rescuer's thread with one contact. */
export async function GET(request: Request) {
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

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Choose a person" } },
      { status: 400 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const conversation = await messagingService.getRescuerDirect(userId, actor);
    return NextResponse.json({ ok: true, data: conversation });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages/direct:get]", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not load this chat" } },
      { status: 500 },
    );
  }
}

/** POST /api/messages/direct - start or continue a direct thread as a rescuer. */
export async function POST(request: Request) {
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
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message:
            parsed.error.issues[0]?.message ?? "Choose a person and write a message",
        },
      },
      { status: 400 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const conversation = await messagingService.startRescuerConversation(
      parsed.data,
      actor,
    );
    return NextResponse.json({ ok: true, data: conversation });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages/direct]", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not send that message" } },
      { status: 500 },
    );
  }
}
