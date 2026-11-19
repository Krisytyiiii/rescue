import { NextResponse } from "next/server";

import { conversationStatusSchema, messagingService } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = conversationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid status");
  }

  const { id } = await context.params;

  try {
    const result = await messagingService.setStatus(id, parsed.data.status, auth.actor);
    await broadcastAdminChange("conversations");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not update this conversation");
  }
}
