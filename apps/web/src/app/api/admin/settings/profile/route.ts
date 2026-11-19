import { NextResponse } from "next/server";

import { settingsService, updateProfileSchema } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function PATCH(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Check the profile fields",
        },
      },
      { status: 422 },
    );
  }

  try {
    await settingsService.updateProfile(auth.actor, parsed.data);
    return NextResponse.json({ ok: true, data: { updated: true } });
  } catch (error) {
    console.error("[settings/profile] update failed", error);
    return apiError(error, "Could not update the profile");
  }
}
