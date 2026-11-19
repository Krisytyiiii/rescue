import { NextResponse } from "next/server";

import { messagingService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

/** People the signed-in admin can start a message thread with. */
export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const q = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const people = await messagingService.searchMessageCandidates(q, auth.actor);
    return NextResponse.json({ ok: true, data: people });
  } catch (error) {
    return apiError(error, "Could not search for people");
  }
}
