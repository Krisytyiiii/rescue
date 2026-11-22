import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { redirect } from "next/navigation";

import { authService, animalsService, reportsService, type Actor } from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { toAnimalRow } from "@/components/admin/animals/animals-data";
import { AnimalsStats } from "@/components/admin/animals/animals-stats";
import { AnimalsWorkbench } from "@/components/admin/animals/animals-workbench";
import type { RescueReportOption } from "@/components/admin/animals/animals-types";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Animals — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminAnimalsPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  // Loaded once. Search, filters, sidebar tabs, and pagination are client-side.
  const animals = await fetchAllPages((page, pageSize) =>
    animalsService.list({ page, pageSize }, actor),
  );
  // Resident adoption posts are moderated on the community page.
  const rows = animals
    .filter((animal) => animal.originType !== "community_post")
    .map(toAnimalRow);
  const counts = await animalsService.getAdminCounts();

  // Rescued reports that do not yet have an animal record can be turned into
  // one from the intake form's first step.
  const rescuedReports = await fetchAllPages((page, pageSize) =>
    reportsService.list({ status: "rescued", page, pageSize }),
  );
  const rescueReportOptions: RescueReportOption[] = rescuedReports
    .filter((report) => !report.resultingAnimal)
    .map((report) => ({
      id: report.id,
      reportCode: report.reportCode,
      species: report.species ?? "unknown",
      reportType: report.reportType,
      urgencyLevel: report.urgencyLevel,
      description: report.description,
      locationLandmark: report.locationLandmark,
      barangayName: report.barangay?.name ?? null,
      photoUrl:
        report.media.find((item) => item.mediaType === "photo")?.fileUrl ?? null,
      submittedAt: report.submittedAt.toISOString(),
    }));

  return (
    <div className="w-full min-w-0">
      <AdminLiveRefresh />

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,2.6rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Animals
          </h1>
          <p className="mt-2 max-w-[68ch] text-[0.9375rem] leading-[1.65] text-ink/55">
            Add rescued animals, send them to the city vet for care, keep track of
            check-ups, vaccinations, and heart rate, then show them on the adoption
            page when they&apos;re ready.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60">
          <PawPrint className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
          Health checks for every animal
        </span>
      </div>

      <AnimalsStats counts={counts} />

      <section className="mt-4 grid min-h-[480px] overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)] lg:grid-cols-[216px_minmax(0,1fr)]">
        <AnimalsWorkbench
          animals={rows}
          counts={counts}
          rescueReports={rescueReportOptions}
        />
      </section>
    </div>
  );
}
