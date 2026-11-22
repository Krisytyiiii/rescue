import { NextResponse } from "next/server";

import {
  authService,
  isAppError,
  messagingService,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

/**
 * DELETE /api/messages/:id?scope=me|everyone - rescuer message deletion.
 * `me` hides the message only for the signed-in rescuer; `everyone` soft
 * deletes it for the whole conversation (own messages only).
 */
export async function DELETE(
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

  const scope = new URL(request.url).searchParams.get("scope") ?? "me";
  if (scope !== "me" && scope !== "everyone") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "Choose who the message is deleted for" },
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
    const result =
      scope === "everyone"
        ? await messagingService.deleteMessage(id, actor)
        : await messagingService.deleteMessageForMe(id, actor);
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[messages/:id:delete]", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not delete this message" } },
      { status: 500 },
    );
  }
}
