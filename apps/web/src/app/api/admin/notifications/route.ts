import { NextResponse } from "next/server";

import { listNotificationsSchema, messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function GET(request: Request) {
  // Scoped to the signed-in admin by the service layer.
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = listNotificationsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION", message: "Invalid filters" } },
      { status: 422 },
    );
  }

  try {
    const result = await messagingService.listNotifications(parsed.data, auth.actor);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not load notifications");
  }
}
