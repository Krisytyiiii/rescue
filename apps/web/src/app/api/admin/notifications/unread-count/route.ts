import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

/** Live unread badge value for the signed-in admin. */
export async function GET() {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  try {
    const counts = await messagingService.getNotificationCounts(auth.actor);
    return NextResponse.json({ ok: true, data: { unread: counts.unread } });
  } catch (error) {
    return apiError(error, "Could not load your unread count");
  }
}
