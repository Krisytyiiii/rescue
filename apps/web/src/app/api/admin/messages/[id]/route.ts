import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const scope = new URL(request.url).searchParams.get("scope") ?? "everyone";
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
    const result =
      scope === "me"
        ? await messagingService.deleteMessageForMe(id, auth.actor)
        : await messagingService.deleteMessage(id, auth.actor);
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not remove this message");
  }
}
