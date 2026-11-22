import { NextResponse, type NextRequest } from "next/server";

import { authService, isAppError, resendVerificationSchema } from "@furescue/core";

export async function POST(request: NextRequest) {
  const parsed = resendVerificationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" },
      },
      { status: 422 },
    );
  }

  try {
    await authService.resendVerification(parsed.data);
    return NextResponse.json({
      ok: true,
      data: { message: "If that account needs verification, a new code is on its way." },
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/resend-verification]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "We couldn't send a new code. Please try again in a moment.",
        },
      },
      { status: 500 },
    );
  }
}
