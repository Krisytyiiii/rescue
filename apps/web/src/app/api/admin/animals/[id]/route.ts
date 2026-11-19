import { NextResponse } from "next/server";

import { animalsService, updateAnimalSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid animal details");
  }

  const { id } = await context.params;

  try {
    const animal = await animalsService.update(id, parsed.data, auth.actor);
    return NextResponse.json({
      ok: true,
      data: {
        id: animal.id,
        lifecycleStatus: animal.lifecycleStatus,
        listingStatus: animal.listingStatus,
      },
    });
  } catch (error) {
    return apiError(error, "Could not update the animal");
  }
}
