import { NextResponse } from "next/server";

import { messagingService, startConversationSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Choose a person");
  }

  try {
    const conversation = await messagingService.startConversation(
      parsed.data,
      auth.actor,
    );
    await broadcastAdminChange("conversations");
    await broadcastAdminChange("messages");
    return NextResponse.json({ ok: true, data: conversation });
  } catch (error) {
    return apiError(error, "Could not start this conversation");
  }
}
