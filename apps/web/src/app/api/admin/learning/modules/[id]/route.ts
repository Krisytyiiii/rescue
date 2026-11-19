import { NextResponse } from "next/server";

import { learningService, type SaveModuleInput } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return validationError("Invalid course id");

  const body = (await request.json().catch(() => null)) as SaveModuleInput | null;
  if (!body) return validationError("A course payload is required");

  try {
    const module = await learningService.saveModule({ ...body, id: moduleId }, auth.actor);
    await broadcastAdminChange("learning_modules");
    return NextResponse.json({ ok: true, data: module });
  } catch (error) {
    return apiError(error, "Could not save this course");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return validationError("Invalid course id");

  const body = (await request.json().catch(() => null)) as
    | { isPublished?: boolean }
    | null;
  if (typeof body?.isPublished !== "boolean") {
    return validationError("isPublished must be true or false");
  }

  try {
    await learningService.setPublished(moduleId, body.isPublished, auth.actor);
    await broadcastAdminChange("learning_modules");
    return NextResponse.json({ ok: true, data: { id: moduleId, isPublished: body.isPublished } });
  } catch (error) {
    return apiError(error, "Could not update this course");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return validationError("Invalid course id");

  try {
    await learningService.deleteModule(moduleId, auth.actor);
    await broadcastAdminChange("learning_modules");
    return NextResponse.json({ ok: true, data: { id: moduleId } });
  } catch (error) {
    return apiError(error, "Could not delete this course");
  }
}
