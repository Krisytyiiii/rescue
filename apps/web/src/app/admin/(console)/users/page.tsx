import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Suspense } from "react";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { UsersConsole } from "@/components/admin/users/users-console";
import { UsersStats, UsersStatsSkeleton } from "@/components/admin/users/users-stats";
import type { UserRow } from "@/components/admin/users/users-types";
import { readSession } from "@/lib/auth/session";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { authService } from "@furescue/core";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Users & access — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  // Loaded once. Search and tabs run against this list in the browser.
  const users = await fetchAllPages((page, pageSize) =>
    authService.listUsers({ page, pageSize }),
  );

  const rows: UserRow[] = users.map((user) => ({
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
          <h2 className="text-[0.9375rem] font-semibold text-ink">All accounts</h2>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink/45">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            Results update as you type
          </span>
        </div>

        <UsersConsole rows={rows} currentUserId={session.sub} />
      </section>
    </div>
  );
}
