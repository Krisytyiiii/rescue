import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as { isRead?: boolean } | null;
  const { id } = await context.params;

  try {
    const result = await messagingService.markNotificationRead(
      id,
      body?.isRead ?? true,
      auth.actor,
    );
    await broadcastAdminChange("notifications");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not update this notification");
  }
}
