import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { authService, isAppError, registerSchema } from "@furescue/core";

import { setSessionCookie } from "@/lib/auth/session";

const signupSchema = registerSchema.extend({
  role: z.enum(["community_user", "rescuer"]).default("community_user"),
});

export async function POST(request: NextRequest) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid details",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  try {
    const result = await authService.register(parsed.data);

    if (result.status === "pending" || !result.session) {
      return NextResponse.json({
        ok: true,
        data: { status: "pending", user: result.user },
      });
    }

    const response = NextResponse.json({
      ok: true,
      data: { status: "active", user: result.user },
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
    console.error("[auth/signup]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong while creating your account. Please try again in a moment.",
        },
      },
      { status: 500 },
    );
  }
}
