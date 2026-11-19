import { NextResponse } from "next/server";

import { changePasswordSchema, settingsService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Check the password fields",
        },
      },
      { status: 422 },
    );
  }

  try {
    await settingsService.changePassword(
      auth.actor,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return NextResponse.json({ ok: true, data: { changed: true } });
  } catch (error) {
    return apiError(error, "Could not change the password");
  }
}
