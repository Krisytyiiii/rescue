import { ClipboardCheck, UserCheck, Users, UserX } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@furescue/core";

/** Account counters streamed separately so the page shell renders instantly. */
export async function UsersStats() {
  const [pendingRescuers, activeRescuers, communityUsers, suspended] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null, accountStatus: "pending", role: { roleName: "rescuer" } },
    }),
    prisma.user.count({
      where: { deletedAt: null, accountStatus: "active", role: { roleName: "rescuer" } },
    }),
    prisma.user.count({
      where: { deletedAt: null, accountStatus: "active", role: { roleName: "community_user" } },
    }),
    prisma.user.count({
      where: { deletedAt: null, accountStatus: "suspended" },
    }),
  ]);

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Awaiting approval"
        value={pendingRescuers}
        hint="Rescuer applications"
        icon={ClipboardCheck}
        tone="clay"
      />
      <StatCard
        label="Active rescuers"
        value={activeRescuers}
        hint="Can take assignments"
        icon={UserCheck}
        tone="moss"
      />
      <StatCard
        label="Community users"
        value={communityUsers}
        hint="Active accounts"
        icon={Users}
        tone="amber"
      />
      <StatCard
        label="Suspended"
        value={suspended}
        hint="Access paused"
        icon={UserX}
        tone="forest"
      />
    </div>
  );
}

export function UsersStatsSkeleton() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[104px] animate-pulse rounded-xl border border-ink/[0.06] bg-white"
        />
      ))}
    </div>
  );
}
