import { NextResponse } from "next/server";

import { adoptionsService, createFollowupSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid follow-up");
  }

  const { id } = await context.params;

  try {
    const followup = await adoptionsService.addFollowup(id, parsed.data, auth.actor);
    return NextResponse.json({
      ok: true,
      data: { id: followup.id, requestId: followup.requestId },
    });
  } catch (error) {
    return apiError(error, "Could not save the follow-up");
  }
}
