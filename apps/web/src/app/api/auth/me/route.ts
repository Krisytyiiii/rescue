import { NextResponse } from "next/server";

import {
  authService,
  isAppError,
  updateAccountProfileSchema,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to continue" } },
      { status: 401 },
    );
  }

  try {
    const user = await authService.me(session.sub);
    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/me]", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "We couldn't load your account." },
      },
      { status: 500 },
    );
  }
}

/** PATCH /api/auth/me - update the signed-in user's own profile. */
export async function PATCH(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to continue" } },
      { status: 401 },
    );
  }

  const parsed = updateAccountProfileSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            parsed.error.issues[0]?.message ?? "Check your profile details.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const user = await authService.updateProfile(session.sub, parsed.data);
    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/me:patch]", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "We couldn't save your profile." },
      },
      { status: 500 },
    );
  }
}
