import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  try {
    const result = await messagingService.deleteMessage(id, auth.actor);
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not remove this message");
  }
}
