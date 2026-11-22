import { NextResponse, type NextRequest } from "next/server";

import { authService, isAppError, loginSchema } from "@furescue/core";

import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Enter a valid email and password" } },
      { status: 422 },
    );
  }

  try {
    const session = await authService.login(parsed.data);
    // The web client relies on the httpOnly cookie. Only hand the raw token to
    // the mobile app, which has no cookie jar and identifies itself explicitly.
    const isMobile = request.headers.get("x-client") === "mobile";
    const response = NextResponse.json({
      ok: true,
      data: {
        user: session.user,
        ...(isMobile
          ? { token: session.token, expiresIn: session.expiresIn }
          : {}),
      },
    });
    setSessionCookie(response, session.token);
    return response;
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/login]", error);
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
