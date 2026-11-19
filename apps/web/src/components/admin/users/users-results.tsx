import { UserX } from "lucide-react";
import Link from "next/link";

import { authService, type ListUsersQuery } from "@furescue/core";

import { Pagination } from "@/components/ui/pagination";

import { UsersTable } from "./users-table";
import type { UserRow } from "./users-types";

interface UsersResultsProps {
  query: ListUsersQuery;
  page: number;
  baseParams: Record<string, string>;
  hasFilters: boolean;
  currentUserId: string;
}

function pageHref(baseParams: Record<string, string>, target: number): string {
  const next = new URLSearchParams(baseParams);
  if (target > 1) next.set("page", String(target));
  const query = next.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

/** Streamed account directory — keyed by filters so stale rows are replaced. */
export async function UsersResults({
  query,
  baseParams,
  hasFilters,
  currentUserId,
}: UsersResultsProps) {
  const { items, meta } = await authService.listUsers(query);
  const first = items.length === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const last = (meta.page - 1) * meta.pageSize + items.length;

  const rows: UserRow[] = items.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    barangay: user.barangay,
    profilePhotoUrl: user.profilePhotoUrl,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  }));

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-clay/10 text-clay">
          <UserX className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-[0.9375rem] font-medium text-ink">
          {hasFilters ? "No users match these filters" : "No accounts yet"}
        </p>
        <p className="mt-1 max-w-[40ch] text-[0.8125rem] leading-[1.55] text-ink/55">
          {hasFilters
            ? "Try clearing a filter or widening the search."
            : "New community and rescuer accounts will appear here."}
        </p>
        {hasFilters && (
          <Link
            href="/admin/users"
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
          >
            Clear filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="px-4 pt-1 text-[0.6875rem] text-ink/40">
        Showing {first}–{last} of {meta.total}
      </p>

      <UsersTable rows={rows} currentUserId={currentUserId} />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        itemLabel="users"
        hrefForPage={(next) => pageHref(baseParams, next)}
        className="border-t border-ink/[0.07] px-4 py-3"
      />
    </>
  );
}

export function UsersResultsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
        <span className="h-3 w-36 animate-pulse rounded bg-ink/[0.07]" />
      </div>
      <div className="overflow-hidden rounded-lg border border-ink/[0.06]">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-ink/[0.05] px-3 py-3 last:border-b-0"
          >
            <div className="h-9 w-9 animate-pulse rounded-full bg-ink/[0.06]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink/[0.06]" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-ink/[0.05]" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded-full bg-ink/[0.06]" />
            <div className="h-4 w-14 animate-pulse rounded-full bg-ink/[0.05]" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-ink/[0.05]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading accounts…</span>
    </div>
  );
}
