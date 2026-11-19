import { NextResponse } from "next/server";

import { learningService, type SaveModuleInput } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

export async function GET() {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  try {
    const modules = await learningService.listModules(auth.actor);
    return NextResponse.json({ ok: true, data: modules });
  } catch (error) {
    return apiError(error, "Could not load the learning catalog");
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as SaveModuleInput | null;
  if (!body) return validationError("A course payload is required");

  try {
    const module = await learningService.saveModule(body, auth.actor);
    await broadcastAdminChange("learning_modules");
    return NextResponse.json({ ok: true, data: module }, { status: 201 });
  } catch (error) {
    return apiError(error, "Could not save this course");
  }
}
