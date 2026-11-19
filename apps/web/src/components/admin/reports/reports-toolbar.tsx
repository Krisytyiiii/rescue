"use client";

import { useRouter } from "next/navigation";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

interface ReportsToolbarProps {
  q: string;
  status: string;
  urgency: string;
  reportType: string;
  species: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "verified", label: "Verified" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "rescued", label: "Rescued" },
  { value: "unable_to_locate", label: "Unable to locate" },
  { value: "rejected", label: "Rejected" },
  { value: "closed", label: "Closed" },
];

const URGENCY_OPTIONS = [
  { value: "", label: "Any urgency" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "stray", label: "Stray" },
  { value: "injured", label: "Injured" },
  { value: "abandoned", label: "Abandoned" },
];

const SPECIES_OPTIONS = [
  { value: "", label: "Any species" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "unknown", label: "Unknown" },
];

/** Filters applied instantly through the URL — no submit button needed. */
export function ReportsToolbar({ q, status, urgency, reportType, species }: ReportsToolbarProps) {
  const router = useRouter();

  function apply(overrides: Record<string, string>) {
    // Seed from the live URL so rapid successive changes never overwrite each
    // other with stale server props.
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(overrides)) {
      const trimmed = value.trim();
      if (trimmed) next.set(key, trimmed);
      else next.delete(key);
    }
    next.delete("page");

    const query = next.toString();
    router.replace(query ? `/admin/reports?${query}` : "/admin/reports", {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
        <SearchInput
          basePath="/admin/reports"
          defaultValue={q}
          label="Search reports"
          placeholder="Search code, description, or landmark"
          className="w-full sm:w-64"
        />

        <Select
          name="status"
          options={STATUS_OPTIONS}
          defaultValue={status}
          placeholder="All statuses"
          size="compact"
          className="w-full sm:w-36"
          onChange={(value) => apply({ status: value })}
        />
        <Select
          name="urgency"
          options={URGENCY_OPTIONS}
          defaultValue={urgency}
          placeholder="Any urgency"
          size="compact"
          className="w-full sm:w-36"
          onChange={(value) => apply({ urgency: value })}
        />
        <Select
          name="type"
          options={TYPE_OPTIONS}
          defaultValue={reportType}
          placeholder="Any type"
          size="compact"
          className="w-full sm:w-36"
          onChange={(value) => apply({ type: value })}
        />
        <Select
          name="species"
          options={SPECIES_OPTIONS}
          defaultValue={species}
          placeholder="Any species"
          size="compact"
          className="w-full sm:w-36"
          onChange={(value) => apply({ species: value })}
        />
      </div>
  );
}
