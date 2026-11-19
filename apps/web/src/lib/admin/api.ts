import { NextResponse } from "next/server";

import { authService, isAppError, type Actor } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

/** Resolves the signed-in admin into a domain actor, or returns a 401 response. */
export async function requireAdminActor(): Promise<
  { actor: Actor; response?: never } | { actor?: never; response: NextResponse }
> {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return {
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Admin sign in required" } },
        { status: 401 },
      ),
    };
  }

  const admin = await authService.me(session.sub);
  return {
    actor: {
      userId: admin.id,
      role: admin.role,
      barangayId: admin.barangayId,
    },
  };
}

export function apiError(error: unknown, fallback: string): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: fallback } },
    { status: 500 },
  );
}

export function validationError(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code: "VALIDATION_ERROR", message } },
    { status: 400 },
  );
}
