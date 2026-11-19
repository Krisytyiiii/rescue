import { NextResponse } from "next/server";

import { learningService } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return validationError("Invalid course id");

  try {
    const module = await learningService.duplicateModule(moduleId, auth.actor);
    await broadcastAdminChange("learning_modules");
    return NextResponse.json({ ok: true, data: module }, { status: 201 });
  } catch (error) {
    return apiError(error, "Could not duplicate this course");
  }
}
