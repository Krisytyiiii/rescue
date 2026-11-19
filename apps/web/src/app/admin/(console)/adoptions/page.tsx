import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  adoptionsService,
  animalsService,
  authService,
  type Actor,
} from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import {
  toAdoptionAnimalRow,
  toAdoptionRow,
} from "@/components/admin/adoptions/adoptions-data";
import {
  AdoptionWorkbench,
  type TabId,
} from "@/components/admin/adoptions/adoptions-workbench";
import { AdoptionViewTabs } from "@/components/admin/adoptions/adoptions-view-tabs";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Adoptions — FuRescue admin",
  robots: { index: false, follow: false },
};

const TABS: TabId[] = [
  "all",
  "submitted",
  "under_review",
  "interview_scheduled",
  "approved",
  "completed",
  "closed",
];

interface AdoptionsPageProps {
  searchParams: Promise<{ tab?: string; view?: string; q?: string }>;
}

export default async function AdminAdoptionsPage({ searchParams }: AdoptionsPageProps) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const params = await searchParams;
  const initialTab = TABS.includes(params.tab as TabId) ? (params.tab as TabId) : "all";
  const initialView = params.view === "animals" ? "animals" : "applications";
  const initialQuery = params.q ?? "";

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  // Loaded once; filters, search, tabs, and pagination run in memory.
  const [requests, animals] = await Promise.all([
    fetchAllPages((page, pageSize) => adoptionsService.list({ page, pageSize }, actor)),
    fetchAllPages((page, pageSize) => animalsService.list({ page, pageSize }, actor)),
  ]);

  const openStatuses = new Set([
    "submitted",
    "under_review",
    "interview_scheduled",
    "approved",
  ]);
  const openByAnimal = new Map<string, number>();
  for (const request of requests) {
    if (!openStatuses.has(request.status)) continue;
    openByAnimal.set(request.animal.id, (openByAnimal.get(request.animal.id) ?? 0) + 1);
  }

  const adoptionAnimals = animals
    .filter((animal) =>
      ["available", "adoption_pending", "adopted"].includes(animal.lifecycleStatus),
    )
    .map((animal) => ({
      ...toAdoptionAnimalRow(animal),
      openApplications: openByAnimal.get(animal.id) ?? 0,
    }));

  return (
    <div className="w-full">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Adoptions
          </h1>
          <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-[1.65] text-ink/55">
            Review applications, interview adopters, approve one applicant per animal,
            and record post-adoption welfare checks.
          </p>
        </div>

        <AdoptionViewTabs
          value={initialView}
          animalCount={adoptionAnimals.length}
          applicationCount={requests.length}
        />
      </div>

      <AdoptionWorkbench
        key={`${initialView}:${initialTab}:${initialQuery}`}
        requests={requests.map(toAdoptionRow)}
        animals={adoptionAnimals}
        initialTab={initialTab}
        initialView={initialView}
        initialQuery={initialQuery}
      />
    </div>
  );
}
