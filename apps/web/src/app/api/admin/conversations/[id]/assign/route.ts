import { NextResponse } from "next/server";

import { assignConversationSchema, messagingService } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = assignConversationSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid assignee");
  }

  const { id } = await context.params;

  try {
    const result = await messagingService.assign(id, parsed.data.userId, auth.actor);
    await broadcastAdminChange("conversations");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not assign this conversation");
  }
}
