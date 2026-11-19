import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AUDIT_DOMAIN_VALUES,
  AUDIT_RANGE_VALUES,
  auditService,
  authService,
  type Actor,
  type AuditDomain,
  type AuditRange,
} from "@furescue/core";

import { AuditConsole, type AuditFilters } from "@/components/admin/audit/audit-console";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Audit logs — FuRescue admin",
  robots: { index: false, follow: false },
};

function parseRange(value: string | undefined): AuditRange {
  return AUDIT_RANGE_VALUES.includes(value as AuditRange) ? (value as AuditRange) : "7d";
}

function parseDomain(value: string | undefined): AuditDomain {
  return AUDIT_DOMAIN_VALUES.includes(value as AuditDomain) ? (value as AuditDomain) : "all";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    domain?: string;
    actor?: string;
    action?: string;
    q?: string;
    entityType?: string;
    entityId?: string;
    page?: string;
  }>;
}) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const filters: AuditFilters = {
    range: parseRange(params.range),
    domain: parseDomain(params.domain),
    actor: params.actor ?? "",
    action: params.action ?? "",
    q: params.q ?? "",
    entityType: params.entityType ?? "",
    entityId: params.entityId ?? "",
    page,
  };

  const data = await auditService.list(
    {
      range: filters.range,
      domain: filters.domain,
      actorId: filters.actor || undefined,
      action: filters.action || undefined,
      q: filters.q || undefined,
      entityType: filters.entityType || undefined,
      entityId: filters.entityId || undefined,
      page: filters.page,
      pageSize: 10,
    },
    actor,
  );

  return (
    <div className="w-full">
      <AuditConsole data={data} filters={filters} />
    </div>
  );
}
