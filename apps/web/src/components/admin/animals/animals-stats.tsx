import { ClipboardList, HeartPulse, Home, ShieldAlert } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";

import type { AnimalCounts } from "./animals-types";

export function AnimalsStats({ counts }: { counts: AnimalCounts }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="In care"
        value={counts.inCare}
        hint="Rescued or at the city vet"
        icon={HeartPulse}
        tone="moss"
        href="/admin/animals?lifecycle=under_care"
      />
      <StatCard
        label="Available"
        value={counts.available}
        hint="Ready for adoption"
        icon={Home}
        tone="clay"
        href="/admin/animals?lifecycle=available"
      />
      <StatCard
        label="Adoption pending"
        value={counts.adoptionPending}
        hint="Paperwork being finalised"
        icon={ClipboardList}
        tone="amber"
        href="/admin/animals?lifecycle=adoption_pending"
      />
      <StatCard
        label="Needs review"
        value={counts.pendingReview}
        hint="Posts waiting for approval"
        icon={ShieldAlert}
        tone="forest"
        href="/admin/animals?listing=pending_review"
      />
    </div>
  );
}
