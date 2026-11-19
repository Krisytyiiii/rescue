import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Suspense } from "react";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { UsersResults, UsersResultsSkeleton } from "@/components/admin/users/users-results";
import { UsersStats, UsersStatsSkeleton } from "@/components/admin/users/users-stats";
import { UsersToolbar } from "@/components/admin/users/users-toolbar";
import { readSession } from "@/lib/auth/session";
import type { ListUsersQuery, RoleName } from "@furescue/core";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Users & access — FuRescue admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;
const ROLES: RoleName[] = ["community_user", "rescuer", "admin"];
const STATUSES = ["pending", "active", "suspended", "deactivated"] as const;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const params = await searchParams;

  const q = first(params.q).trim();
  const roleParam = first(params.role);
  const statusParam = first(params.status);
  const pageParam = Number.parseInt(first(params.page), 10);

  const role = ROLES.includes(roleParam as RoleName) ? (roleParam as RoleName) : undefined;
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : undefined;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const hasFilters = Boolean(q || role || status);

  const listQuery: ListUsersQuery = {
    page,
    pageSize: PAGE_SIZE,
    ...(q ? { search: q } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };

  const baseParams: Record<string, string> = {};
  if (q) baseParams.q = q;
  if (role) baseParams.role = role;
  if (status) baseParams.status = status;

  // A new key discards stale rows immediately and swaps in the skeleton.
  const resultsKey = [q, roleParam, statusParam, page].join("|");

  return (
    <div className="w-full">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Users &amp; access
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-[1.65] text-ink/55 lg:whitespace-nowrap">
            Approve rescuer applications, manage roles and account status, and keep access
            auditable.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
          <Users className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          Live user feed
        </span>
      </div>

      <Suspense fallback={<UsersStatsSkeleton />}>
        <UsersStats />
      </Suspense>

      <section className="mt-4 flex min-h-[480px] flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3.5">
          <h2 className="text-[0.9375rem] font-semibold text-ink">
            {hasFilters ? "Filtered accounts" : "All accounts"}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink/45">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Results update as you filter
          </span>
        </div>

        <div className="px-4 py-4">
          <UsersToolbar q={q} role={roleParam} status={statusParam} />
        </div>

        <Suspense key={resultsKey} fallback={<UsersResultsSkeleton />}>
          <UsersResults
            query={listQuery}
            page={page}
            baseParams={baseParams}
            hasFilters={hasFilters}
            currentUserId={session.sub}
          />
        </Suspense>
      </section>
    </div>
  );
}
