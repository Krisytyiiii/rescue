import { CheckCircle2, ClipboardCheck, PawPrint, Siren } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@furescue/core";

const OPEN_REPORT_STATUSES = ["submitted", "verified", "assigned", "in_progress"] as const;

/** Report counters streamed in separately so the page shell renders instantly. */
export async function ReportsStats() {
  const statusGroups = await prisma.report.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all]),
  ) as Record<string, number>;

  const activeRescues = (counts.assigned ?? 0) + (counts.in_progress ?? 0);

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Awaiting verification"
        value={counts.submitted ?? 0}
        hint="Submitted by residents"
        icon={ClipboardCheck}
        tone="clay"
      />
      <StatCard
        label="Ready to assign"
        value={counts.verified ?? 0}
        hint="Verified, no rescuer yet"
        icon={Siren}
        tone="amber"
      />
      <StatCard
        label="Active rescues"
        value={activeRescues}
        hint="Assigned or in progress"
        icon={PawPrint}
        tone="moss"
      />
      <StatCard
        label="Rescued"
        value={counts.rescued ?? 0}
        hint="Awaiting closure"
        icon={CheckCircle2}
        tone="forest"
      />
    </div>
  );
}

export function ReportsStatsSkeleton() {
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
