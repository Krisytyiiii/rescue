import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

/** Marks every unread notification belonging to the signed-in admin as read. */
export async function POST() {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  try {
    const result = await messagingService.markAllNotificationsRead(auth.actor);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not update your notifications");
  }
}
