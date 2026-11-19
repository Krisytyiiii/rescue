import { NextResponse } from "next/server";

import { animalsService, createAnimalSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createAnimalSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid intake details");
  }

  try {
    const animal = await animalsService.create(parsed.data, auth.actor);
    return NextResponse.json({
      ok: true,
      data: {
        id: animal.id,
        animalCode: animal.animalCode,
        lifecycleStatus: animal.lifecycleStatus,
        listingStatus: animal.listingStatus,
      },
    });
  } catch (error) {
    return apiError(error, "Could not create the animal intake");
  }
}
