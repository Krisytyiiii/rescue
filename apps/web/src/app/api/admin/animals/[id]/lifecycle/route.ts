import { NextResponse } from "next/server";

import { animalsService, updateLifecycleSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateLifecycleSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid lifecycle change");
  }

  const { id } = await context.params;

  try {
    const animal = await animalsService.updateLifecycle(
      id,
      parsed.data.status,
      parsed.data.remarks,
      auth.actor,
    );
    return NextResponse.json({
      ok: true,
      data: { id: animal.id, lifecycleStatus: animal.lifecycleStatus },
    });
  } catch (error) {
    return apiError(error, "Could not change the animal's status");
  }
}
