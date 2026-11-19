import { NextResponse } from "next/server";

import { animalsService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  try {
    await animalsService.archive(id, auth.actor);
    return NextResponse.json({ ok: true, data: { id, listingStatus: "archived" } });
  } catch (error) {
    return apiError(error, "Could not archive the animal");
  }
}
