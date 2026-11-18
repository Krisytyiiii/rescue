import { NextResponse, type NextRequest } from "next/server";

import { authService, isAppError, loginSchema } from "@furescue/core";

import { setSessionCookie } from "@/lib/auth/session";

/** Dedicated credential login for the administrator portal. */
export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Enter your administrator email and password.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const session = await authService.login(parsed.data);

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "This portal is for administrators only. Use the regular login page.",
          },
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true, data: { user: session.user } });
    setSessionCookie(response, session.token);
    return response;
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/admin-login]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "We couldn't sign you in right now. Please try again in a moment.",
        },
      },
      { status: 500 },
    );
  }
}
