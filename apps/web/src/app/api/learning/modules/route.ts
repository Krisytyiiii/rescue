import { NextResponse } from "next/server";

import { authService, learningService } from "@furescue/core";

import { apiError } from "@/lib/admin/api";
import { readSession } from "@/lib/auth/session";

/** Published learning modules for residents (mobile app and website). */
export async function GET() {
  const session = await readSession();
  const userId = session
    ? (await authService.me(session.sub).catch(() => null))?.id
    : undefined;

  try {
    const modules = await learningService.listPublishedModules(userId);
    return NextResponse.json({ ok: true, data: modules });
  } catch (error) {
    return apiError(error, "Could not load the learning modules");
  }
}
