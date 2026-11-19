import { NextResponse } from "next/server";

import { authService, learningService, type Actor } from "@furescue/core";

import { apiError } from "@/lib/admin/api";
import { readSession } from "@/lib/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string; lessonId: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to track your progress" } },
      { status: 401 },
    );
  }

  const { id, lessonId } = await context.params;
  const moduleId = Number(id);
  const lesson = Number(lessonId);
  if (!Number.isInteger(moduleId) || !Number.isInteger(lesson)) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid lesson" } },
      { status: 400 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    const actor: Actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
    const result = await learningService.completeLesson(moduleId, lesson, actor);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not save your progress");
  }
}
