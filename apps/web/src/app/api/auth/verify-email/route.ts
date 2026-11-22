import { NextResponse, type NextRequest } from "next/server";

import { authService, isAppError, verifyEmailSchema } from "@furescue/core";

import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const parsed = verifyEmailSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Enter the 6-digit code",
        },
      },
      { status: 422 },
    );
  }

  try {
    const result = await authService.verifyEmail(parsed.data);

    if (result.status !== "active" || !result.session) {
      return NextResponse.json({
        ok: true,
        data: { status: "pending", user: result.user },
      });
    }

    const isMobile = request.headers.get("x-client") === "mobile";
    const response = NextResponse.json({
      ok: true,
      data: {
        status: "active",
        user: result.user,
        ...(isMobile
          ? { token: result.session.token, expiresIn: result.session.expiresIn }
          : {}),
      },
    });
    setSessionCookie(response, result.session.token);
    return response;
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/verify-email]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "We couldn't verify that code. Please try again in a moment.",
        },
      },
      { status: 500 },
    );
  }
}
