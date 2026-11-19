import { NextResponse } from "next/server";

import {
  AUDIT_DOMAIN_VALUES,
  AUDIT_RANGE_VALUES,
  auditService,
  type AuditDomain,
  type AuditRange,
} from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const range = params.get("range");
  const domain = params.get("domain");

  try {
    const result = await auditService.list(
      {
        range: AUDIT_RANGE_VALUES.includes(range as AuditRange)
          ? (range as AuditRange)
          : "7d",
        domain: AUDIT_DOMAIN_VALUES.includes(domain as AuditDomain)
          ? (domain as AuditDomain)
          : "all",
        actorId: params.get("actor") ?? undefined,
        action: params.get("action") ?? undefined,
        entityType: params.get("entityType") ?? undefined,
        entityId: params.get("entityId") ?? undefined,
        q: params.get("q") ?? undefined,
        page: Number(params.get("page") ?? 1),
        pageSize: Number(params.get("pageSize") ?? 10),
      },
      auth.actor,
    );
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return apiError(error, "Could not load audit logs");
  }
}
