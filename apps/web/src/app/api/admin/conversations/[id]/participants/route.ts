import { NextResponse } from "next/server";

import { addParticipantSchema, messagingService } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const q = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const people = await messagingService.searchParticipants(id, q, auth.actor);
    return NextResponse.json({ ok: true, data: people });
  } catch (error) {
    return apiError(error, "Could not search for people");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = addParticipantSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Choose a person");
  }

  const { id } = await context.params;

  try {
    const participant = await messagingService.addParticipant(
      id,
      parsed.data.userId,
      auth.actor,
    );
    await broadcastAdminChange("conversation_participants");
    return NextResponse.json({ ok: true, data: participant });
  } catch (error) {
    return apiError(error, "Could not add this person");
  }
}
