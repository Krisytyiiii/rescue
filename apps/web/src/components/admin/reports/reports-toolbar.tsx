"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

export interface ReportFilters {
  q: string;
  status: string;
  urgency: string;
  reportType: string;
  species: string;
}

export const EMPTY_REPORT_FILTERS: ReportFilters = {
  q: "",
  status: "",
  urgency: "",
  reportType: "",
  species: "",
};

interface ReportsToolbarProps {
  filters: ReportFilters;
  onChange: (patch: Partial<ReportFilters>) => void;
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

/** Filters an in-memory report list — no URL writes and no requests. */
export function ReportsToolbar({ filters, onChange }: ReportsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <SearchInput
        value={filters.q}
        onValueChange={(q) => onChange({ q })}
        label="Search reports"
        placeholder="Search code, description, or landmark"
        className="w-full sm:w-64"
      />

      <Select
        name="status"
        options={STATUS_OPTIONS}
        value={filters.status}
        placeholder="All statuses"
        size="compact"
        className="w-full sm:w-36"
        onChange={(status) => onChange({ status })}
      />
      <Select
        name="urgency"
        options={URGENCY_OPTIONS}
        value={filters.urgency}
        placeholder="Any urgency"
        size="compact"
        className="w-full sm:w-36"
        onChange={(urgency) => onChange({ urgency })}
      />
      <Select
        name="type"
        options={TYPE_OPTIONS}
        value={filters.reportType}
        placeholder="Any type"
        size="compact"
        className="w-full sm:w-36"
        onChange={(reportType) => onChange({ reportType })}
      />
      <Select
        name="species"
        options={SPECIES_OPTIONS}
        value={filters.species}
        placeholder="Any species"
        size="compact"
        className="w-full sm:w-36"
        onChange={(species) => onChange({ species })}
      />
    </div>
  );
}
