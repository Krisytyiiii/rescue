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
    const csv = await auditService.exportCsv(
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
      },
      auth.actor,
    );

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="furescue-audit-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error, "Could not export audit logs");
  }
}
