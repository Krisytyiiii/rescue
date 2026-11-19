import { NextResponse } from "next/server";

import { messagingService, sendMessageSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid message");
  }

  const { id } = await context.params;

  try {
    const message = await messagingService.send(id, parsed.data, auth.actor);
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: message });
  } catch (error) {
    return apiError(error, "Could not send your message");
  }
}
