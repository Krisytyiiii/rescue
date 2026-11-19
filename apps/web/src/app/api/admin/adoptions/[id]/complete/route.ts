import { NextResponse } from "next/server";

import { adoptionsService, completeAdoptionSchema } from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = completeAdoptionSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? "Invalid completion");
  }

  const { id } = await context.params;

  try {
    const updated = await adoptionsService.complete(
      id,
      parsed.data.releaseDate,
      parsed.data.decisionRemarks,
      auth.actor,
    );
    return NextResponse.json({
      ok: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    return apiError(error, "Could not complete the adoption");
  }
}
