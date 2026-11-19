import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  try {
    await messagingService.markRead(id, auth.actor);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Could not mark this conversation as read");
  }
}
