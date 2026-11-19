import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  analyticsService,
  authService,
  type Actor,
  type AnalyticsRange,
  type AnalyticsSpeciesFilter,
} from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { AnalyticsConsole } from "@/components/admin/analytics/analytics-console";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Analytics — FuRescue admin",
  robots: { index: false, follow: false },
};

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m", "all"];
const SPECIES: AnalyticsSpeciesFilter[] = ["all", "dog", "cat", "unknown"];

function parseRange(value: string | undefined): AnalyticsRange {
  return RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : "30d";
}

function parseSpecies(value: string | undefined): AnalyticsSpeciesFilter {
  return SPECIES.includes(value as AnalyticsSpeciesFilter) ? (value as AnalyticsSpeciesFilter) : "all";
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; barangay?: string; species?: string }>;
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
  const barangayId = params.barangay ? Number(params.barangay) : undefined;

  const dashboard = await analyticsService.getDashboard(
    {
      range: parseRange(params.range),
      species: parseSpecies(params.species),
      barangayId: Number.isFinite(barangayId) ? barangayId : undefined,
    },
    actor,
  );

  return (
    <div className="w-full">
      <AdminLiveRefresh />
      <AnalyticsConsole data={dashboard} />
    </div>
  );
}
