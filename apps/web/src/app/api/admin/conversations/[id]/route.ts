import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  try {
    const conversation = await messagingService.getById(id, auth.actor);
    return NextResponse.json({ ok: true, data: conversation });
  } catch (error) {
    return apiError(error, "Could not load this conversation");
  }
}
