import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id, userId } = await context.params;

  try {
    await messagingService.removeParticipant(id, userId, auth.actor);
    await broadcastAdminChange("conversation_participants");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Could not remove this person");
  }
}
