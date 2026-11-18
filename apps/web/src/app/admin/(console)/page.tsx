import {
  ArrowUpRight,
  CalendarDays,
  FileWarning,
  HeartHandshake,
  PawPrint,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";

import { AnimalPopulationCard } from "@/components/admin/charts/animal-population-card";
import { ReportsActivityCard, type TrendPoint } from "@/components/admin/charts/reports-activity-card";
import { PendingRescuerList } from "@/components/pending-rescuer-list";
import { StatCard } from "@/components/ui/stat-card";
import { Tooltip } from "@/components/ui/tooltip";
import { authService, prisma } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export const metadata = {
  title: "Dashboard — FuRescue admin",
};

const WORKSPACE = [
  {
    href: "/admin/reports",
    icon: FileWarning,
    label: "Reports",
    copy: "Verify, deduplicate, and assign incoming reports.",
  },
  {
    href: "/admin/rescues",
    icon: Siren,
    label: "Rescue operations",
    copy: "Dispatch field teams and track outcomes to intake.",
  },
  {
    href: "/admin/animals",
    icon: PawPrint,
    label: "Animals",
    copy: "Profiles, media, listings, and lifecycle transitions.",
  },
  {
    href: "/admin/health",
    icon: Stethoscope,
    label: "Health records",
    copy: "Checkups, vaccinations, and heart-rate monitoring.",
  },
  {
    href: "/admin/adoptions",
    icon: HeartHandshake,
    label: "Adoptions",
    copy: "Applications, interviews, and post-adoption checks.",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "Users & access",
    copy: "Approve rescuers and manage roles and account status.",
  },
];

const REPORT_STAGES: { status: string; label: string; tone: string }[] = [
  { status: "submitted", label: "Submitted", tone: "bg-clay" },
  { status: "verified", label: "Verified", tone: "bg-[#c99a4e]" },
  { status: "in_progress", label: "In progress", tone: "bg-moss" },
  { status: "rescued", label: "Rescued", tone: "bg-forest" },
];

const CARE_STAGES: { status: string; label: string; tone: string }[] = [
  { status: "under_care", label: "Under care", tone: "bg-clay" },
  { status: "available", label: "Available", tone: "bg-[#c99a4e]" },
  { status: "adoption_pending", label: "Adoption pending", tone: "bg-moss" },
  { status: "adopted", label: "Adopted", tone: "bg-forest" },
];

const ROLE_LABELS: Record<string, string> = {
  community_user: "Residents",
  rescuer: "Rescuers",
  admin: "Administrators",
};

const ROLE_TONES: Record<string, string> = {
  community_user: "bg-clay",
  rescuer: "bg-moss",
  admin: "bg-forest",
};

const OPEN_REPORT_STATUSES = ["submitted", "verified", "assigned", "in_progress"];
const IN_CARE_STATUSES = ["rescued", "under_care"];

function countMap(rows: { _count: { _all: number } }[], key: string): Record<string, number> {
  return Object.fromEntries(
    rows.map((row) => [
      String((row as unknown as Record<string, unknown>)[key]),
      row._count._all,
    ] as [string, number]),
  );
}

function sum(map: Record<string, number>, keys: string[]): number {
  return keys.reduce((total, key) => total + (map[key] ?? 0), 0);
}

function humanize(value: string): string {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function Breakdown({
  stages,
  counts,
  unit,
}: {
  stages: { status: string; label: string; tone: string }[];
  counts: Record<string, number>;
  unit: { one: string; many: string };
}) {
  const max = Math.max(1, ...stages.map((stage) => counts[stage.status] ?? 0));

  return (
    <ul className="space-y-2.5">
      {stages.map((stage) => {
        const value = counts[stage.status] ?? 0;
        return (
          <li key={stage.status}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.75rem] text-ink/60">{stage.label}</span>
              <span className="font-mono text-[0.6875rem] tabular-nums text-ink/45">{value}</span>
            </div>
            <Tooltip
              content={
                <>
                  <span className="block text-[0.625rem] font-medium uppercase tracking-[0.08em] text-paper/50">
                    {stage.label}
                  </span>
                  <span className="block text-[0.8125rem] font-semibold text-paper">
                    {value} {value === 1 ? unit.one : unit.many}
                  </span>
                </>
              }
            >
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className={`h-full rounded-full ${stage.tone} transition-[width]`}
                  style={{ width: `${value === 0 ? 0 : Math.max(6, (value / max) * 100)}%` }}
                />
              </div>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AdminDashboardPage() {
  const session = await readSession();
  const admin = session ? await authService.me(session.sub) : null;

  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 29);

  const [
    pending,
    reportGroups,
    lifecycleGroups,
    adoptionPending,
    speciesGroups,
    roleRows,
    barangayCount,
    recentReports,
  ] = await Promise.all([
    authService.listPendingRescuers(),
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.animal.groupBy({ by: ["lifecycleStatus"], _count: { _all: true } }),
    prisma.adoptionRequest.count({
      where: { status: { in: ["submitted", "under_review", "interview_scheduled"] } },
    }),
    prisma.animal.groupBy({ by: ["species"], _count: { _all: true } }),
    prisma.role.findMany({
      select: { roleName: true, _count: { select: { users: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.barangay.count(),
    prisma.report.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
  ]);

  const reports = countMap(reportGroups, "status");
  const lifecycle = countMap(lifecycleGroups, "lifecycleStatus");
  const species = countMap(speciesGroups, "species");

  const openReports = sum(reports, OPEN_REPORT_STATUSES);
  const animalsInCare = sum(lifecycle, IN_CARE_STATUSES);
  const totalAnimals = sum(species, ["dog", "cat"]);

  const dayFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
  const fullDayFormatter = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const buckets = new Map<string, number>();
  for (const report of recentReports) {
    const key = `${report.createdAt.getFullYear()}-${report.createdAt.getMonth()}-${report.createdAt.getDate()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const trend: TrendPoint[] = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(trendStart);
    day.setDate(trendStart.getDate() + index);
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    return {
      label: dayFormatter.format(day),
      fullLabel: fullDayFormatter.format(day),
      value: buckets.get(key) ?? 0,
    };
  });

  const roleCounts = Object.fromEntries(
    roleRows.map((row) => [row.roleName, row._count.users]),
  ) as Record<string, number>;
  const totalUsers = Object.values(roleCounts).reduce((total, value) => total + value, 0);

  const roleStages = roleRows.map((row) => ({
    status: row.roleName,
    label: ROLE_LABELS[row.roleName] ?? humanize(row.roleName),
    tone: ROLE_TONES[row.roleName] ?? "bg-clay",
  }));

  const rescuers = pending.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    appliedAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
  const latestRescuers = [...rescuers]
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .slice(0, 3);

  const today = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Welcome back,{" "}
            <span className="font-display-italic text-clay">
              {admin?.firstName?.toLowerCase() ?? "admin"}.
            </span>
          </h1>
          <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-[1.65] text-ink/55">
            Here is the state of the Mati City animal welfare program today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
            <CalendarDays className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
            {today}
          </span>
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-moss/20 bg-moss/[0.06] px-3 text-[0.75rem] font-medium text-moss">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            System operational
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending rescuers"
          value={rescuers.length}
          hint="Awaiting approval"
          icon={Users}
          tone="clay"
          href="/admin/users"
        />
        <StatCard
          label="Open reports"
          value={openReports}
          hint="In the rescue pipeline"
          icon={FileWarning}
          tone="amber"
          href="/admin/reports"
        />
        <StatCard
          label="Animals in care"
          value={animalsInCare}
          hint="Rescued or under treatment"
          icon={PawPrint}
          tone="moss"
          href="/admin/animals"
        />
        <StatCard
          label="Adoption requests"
          value={adoptionPending}
          hint="Pending review"
          icon={HeartHandshake}
          tone="forest"
          href="/admin/adoptions"
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ReportsActivityCard data={trend} />
        <AnimalPopulationCard
          totalAnimals={totalAnimals}
          segments={[
            { label: "Dogs", value: species.dog ?? 0, color: "#2563eb" },
            { label: "Cats", value: species.cat ?? 0, color: "#60a5fa" },
          ]}
        />
      </div>

      {/* Program at a glance */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
          <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3.5">
            <h3 className="text-[0.9375rem] font-semibold text-ink">Report pipeline</h3>
            <Link
              href="/admin/reports"
              aria-label="Open reports"
              className="grid h-7 w-7 place-items-center rounded-full border border-ink/[0.07] text-ink/25 transition-all duration-200 hover:border-clay/30 hover:bg-clay/[0.05] hover:text-clay"
            >
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="px-4 py-4">
            <Breakdown stages={REPORT_STAGES} counts={reports} unit={{ one: "report", many: "reports" }} />
          </div>
        </section>

        <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
          <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3.5">
            <h3 className="text-[0.9375rem] font-semibold text-ink">Animal lifecycle</h3>
            <Link
              href="/admin/animals"
              aria-label="Open animals"
              className="grid h-7 w-7 place-items-center rounded-full border border-ink/[0.07] text-ink/25 transition-all duration-200 hover:border-clay/30 hover:bg-clay/[0.05] hover:text-clay"
            >
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="px-4 py-4">
            <Breakdown stages={CARE_STAGES} counts={lifecycle} unit={{ one: "animal", many: "animals" }} />
          </div>
        </section>
      </div>

      {/* Workspace */}
      <section className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[0.9375rem] font-semibold text-ink">Operations workspace</h2>
            <p className="mt-1 text-[0.8125rem] text-ink/50">
              Jump into the modules that keep the program running.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {/* Quick actions */}
          <section className="flex h-full flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
            <div className="flex h-[52px] items-center border-b border-ink/[0.07] px-4">
              <h2 className="text-[0.9375rem] font-semibold text-ink">Quick actions</h2>
            </div>
            <div className="flex-1 p-3">
              <ul className="grid h-full auto-rows-fr grid-cols-2 gap-2">
                {WORKSPACE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex h-full items-center gap-2.5 rounded-lg border border-ink/[0.06] bg-ink/[0.015] px-2.5 py-2.5 transition-colors hover:border-clay/30 hover:bg-clay/[0.04]"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-ink/50 shadow-[0_1px_2px_rgba(20,30,25,0.06)] transition-colors group-hover:text-clay">
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0 flex-1 text-[0.75rem] font-medium leading-tight text-ink">
                          {item.label}
                        </span>
                        <ArrowUpRight
                          className="h-3 w-3 shrink-0 text-ink/20 transition-colors group-hover:text-clay"
                          strokeWidth={2}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Rescuer approvals */}
          <section className="flex h-full flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
            <div className="flex h-[52px] items-center justify-between gap-3 border-b border-ink/[0.07] px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <h2 className="truncate text-[0.9375rem] font-semibold text-ink">Rescuer approvals</h2>
                {rescuers.length > 0 && (
                  <span className="shrink-0 rounded-full bg-clay/10 px-2 py-0.5 text-[0.625rem] font-semibold text-clay">
                    {rescuers.length} waiting
                  </span>
                )}
              </div>
              <Link
                href="/admin/users"
                className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-ink/50 transition-colors hover:text-clay"
              >
                View all
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            </div>

            <div className="flex flex-1 flex-col justify-center px-4 py-3.5">
              <PendingRescuerList rescuers={latestRescuers} />
            </div>

            <p className="border-t border-ink/[0.07] px-4 py-2.5 text-[0.6875rem] leading-[1.5] text-ink/40">
              Showing the latest applications. Approved volunteers can sign in immediately.
            </p>
          </section>

          {/* Team & coverage */}
          <section className="flex h-full flex-col rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
          <div className="flex h-[52px] items-center justify-between border-b border-ink/[0.07] px-4">
            <h2 className="text-[0.9375rem] font-semibold text-ink">Team &amp; coverage</h2>
            <Link
              href="/admin/users"
              aria-label="Open users and access"
              className="grid h-7 w-7 place-items-center rounded-md text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
            </Link>
          </div>

          <div className="flex-1 px-4 py-3.5">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                Accounts by role
              </span>
              <span className="text-[0.8125rem] font-semibold tabular-nums text-ink">
                {totalUsers}
              </span>
            </div>
            <Breakdown stages={roleStages} counts={roleCounts} unit={{ one: "account", many: "accounts" }} />
          </div>

          <div className="grid grid-cols-2 divide-x divide-ink/[0.07] border-t border-ink/[0.07]">
            <div className="px-4 py-3">
              <p className="font-display text-[1.35rem] leading-none text-ink">{barangayCount}</p>
              <p className="mt-1 text-[0.6875rem] text-ink/45">Barangays covered</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-display text-[1.35rem] leading-none text-ink">{totalAnimals}</p>
              <p className="mt-1 text-[0.6875rem] text-ink/45">Animals on record</p>
            </div>
          </div>
          </section>
        </div>
      </section>
    </div>
  );
}
