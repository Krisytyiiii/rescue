import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { redirect } from "next/navigation";

import {
  authService,
  animalsService,
  healthService,
  type Actor,
} from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import {
  toHealthAnimal,
  toHealthHeartRate,
  toHealthRecord,
  toHealthVaccination,
} from "@/components/admin/health/health-data";
import {
  HealthWorkbench,
} from "@/components/admin/health/health-workbench";
import type { HealthTab } from "@/components/admin/health/health-types";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Health records — FuRescue admin",
  robots: { index: false, follow: false },
};

const TABS: HealthTab[] = ["watchlist", "vaccinations", "records", "heart_rate"];
const STATUSES = ["due", "overdue", "completed"];

interface HealthPageProps {
  searchParams: Promise<{ tab?: string; status?: string; flagged?: string }>;
}

export default async function AdminHealthPage({ searchParams }: HealthPageProps) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const params = await searchParams;
  const initialTab = TABS.includes(params.tab as HealthTab)
    ? (params.tab as HealthTab)
    : "watchlist";
  const initialVaccinationStatus = STATUSES.includes(params.status ?? "")
    ? (params.status as string)
    : "";

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  // Everything is loaded once. Search, filters, tabs, and pagination run in
  // memory so the console stays instant.
  const [animals, records, vaccinations, heartRates] = await Promise.all([
    fetchAllPages((page, pageSize) => animalsService.list({ page, pageSize }, actor)),
    healthService.listAllRecords(actor),
    healthService.listAllVaccinations(actor),
    healthService.listAllHeartRates(actor),
  ]);

  return (
    <div className="w-full">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Animal health
          </h1>
          <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-[1.65] text-ink/55">
            Medical visits, vaccinations, and heart-rate monitoring for every animal
            under care. Work the watchlist, then open an animal for its full history.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
          <Stethoscope className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          Health checks for every animal
        </span>
      </div>

      <HealthWorkbench
        key={`${initialTab}-${initialVaccinationStatus}-${params.flagged ?? ""}`}
        animals={animals.map(toHealthAnimal)}
        records={records.map(toHealthRecord)}
        vaccinations={vaccinations.map(toHealthVaccination)}
        heartRates={heartRates.map(toHealthHeartRate)}
        initialTab={
          initialVaccinationStatus && initialTab === "watchlist"
            ? "vaccinations"
            : initialTab
        }
        initialVaccinationStatus={initialVaccinationStatus}
        initialFlaggedOnly={params.flagged === "1"}
      />
    </div>
  );
}
