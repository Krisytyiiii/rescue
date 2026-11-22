import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { authService, isAppError } from "@furescue/core";

import {
  clearOnboardingCookie,
  readOnboarding,
  readOnboardingToken,
  setSessionCookie,
} from "@/lib/auth/session";

const completeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  middleName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+639\d{9}$/, "Use the format +639XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  barangayId: z.coerce.number().int().positive().optional(),
  role: z.enum(["community_user", "rescuer"]).default("community_user"),
});

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    onboardingToken?: unknown;
  };
  const isMobile = request.headers.get("x-client") === "mobile";
  const pending = isMobile
    ? readOnboardingToken(
        typeof payload.onboardingToken === "string" ? payload.onboardingToken : "",
      )
    : await readOnboarding();
  if (!pending) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Your Google session expired. Start again." } },
      { status: 401 },
    );
  }

  const parsed = completeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid profile details",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  try {
    const result = await authService.registerOAuth({
      ...parsed.data,
      phoneNumber: parsed.data.phoneNumber || undefined,
      email: pending.email,
    });

    if (result.status === "pending" || !result.session) {
      const response = NextResponse.json({
        ok: true,
        data: { status: "pending", user: result.user },
      });
      if (!isMobile) clearOnboardingCookie(response);
      return response;
    }

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
    if (isMobile) {
      setSessionCookie(response, result.session.token);
    } else {
      setSessionCookie(response, result.session.token);
      clearOnboardingCookie(response);
    }
    return response;
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[auth/google/complete]", error);
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
