import { NextResponse } from "next/server";

import { auditService } from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const detail = await auditService.get(id, auth.actor);
    return NextResponse.json({ ok: true, data: detail });
  } catch (error) {
    return apiError(error, "Could not load this audit entry");
  }
}
