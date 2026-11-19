import { NextResponse } from "next/server";

import { animalsService, moderateListingSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = moderateListingSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid listing decision");
  }

  const { id } = await context.params;

  try {
    const animal = await animalsService.moderateListing(
      id,
      parsed.data.listingStatus,
      parsed.data.remarks,
      auth.actor,
    );
    return NextResponse.json({
      ok: true,
      data: { id: animal.id, listingStatus: animal.listingStatus },
    });
  } catch (error) {
    return apiError(error, "Could not update the adoption listing");
  }
}
