import { NextResponse } from "next/server";

import { authService, learningService } from "@furescue/core";

import { apiError, validationError } from "@/lib/admin/api";
import { readSession } from "@/lib/auth/session";

/** One published module with every lesson and its full content. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) return validationError("Invalid course");

  const session = await readSession();
  const userId = session
    ? (await authService.me(session.sub).catch(() => null))?.id
    : undefined;

  try {
    const module = await learningService.getPublishedModule(moduleId, userId);
    return NextResponse.json({ ok: true, data: module });
  } catch (error) {
    return apiError(error, "Could not load this course");
  }
}
