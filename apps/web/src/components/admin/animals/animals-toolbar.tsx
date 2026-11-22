"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

export interface AnimalFilters {
  q: string;
  species: string;
  sex: string;
  size: string;
  lifecycle: string;
  listing: string;
}

export const EMPTY_ANIMAL_FILTERS: AnimalFilters = {
  q: "",
  species: "",
  sex: "",
  size: "",
  lifecycle: "",
  listing: "",
};

interface AnimalsToolbarProps {
  filters: AnimalFilters;
  onChange: (patch: Partial<AnimalFilters>) => void;
  onClear: () => void;
}

const SPECIES_OPTIONS = [
  { value: "", label: "Any species" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
];

const SEX_OPTIONS = [
  { value: "", label: "Any sex" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Any size" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const LIFECYCLE_OPTIONS = [
  { value: "", label: "Any stage" },
  { value: "reported", label: "Reported sighting" },
  { value: "rescued", label: "Rescued" },
  { value: "under_care", label: "At the city vet" },
  { value: "available", label: "Ready for adoption" },
  { value: "adoption_pending", label: "Adoption in progress" },
  { value: "adopted", label: "Adopted" },
  { value: "returned_to_owner", label: "Returned to owner" },
  { value: "deceased", label: "Deceased" },
];

const LISTING_OPTIONS = [
  { value: "", label: "Any visibility" },
  { value: "draft", label: "Not published" },
  { value: "published", label: "Live for adoption" },
  { value: "rejected", label: "Not approved" },
  { value: "archived", label: "No longer listed" },
];

/** Filters an in-memory animal list — no URL writes and no requests. */
export function AnimalsToolbar({ filters, onChange, onClear }: AnimalsToolbarProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={filters.q}
        onValueChange={(q) => onChange({ q })}
        label="Search animals"
        placeholder="Search code, name, or description"
        className="w-full sm:w-56"
      />

      <Select
        name="species"
        options={SPECIES_OPTIONS}
        value={filters.species}
        placeholder="Any species"
        size="compact"
        className="w-32 shrink-0"
        onChange={(species) => onChange({ species })}
      />
      <Select
        name="sex"
        options={SEX_OPTIONS}
        value={filters.sex}
        placeholder="Any sex"
        size="compact"
        className="hidden w-28 shrink-0 xl:block"
        onChange={(sex) => onChange({ sex })}
      />
      <Select
        name="size"
        options={SIZE_OPTIONS}
        value={filters.size}
        placeholder="Any size"
        size="compact"
        className="hidden w-28 shrink-0 2xl:block"
        onChange={(size) => onChange({ size })}
      />
      <Select
        name="lifecycle"
        options={LIFECYCLE_OPTIONS}
        value={filters.lifecycle}
        placeholder="Any stage"
        size="compact"
        className="w-40 shrink-0"
        onChange={(lifecycle) => onChange({ lifecycle })}
      />
      <Select
        name="listing"
        options={LISTING_OPTIONS}
        value={filters.listing}
        placeholder="Any visibility"
        size="compact"
        className="w-40 shrink-0"
        onChange={(listing) => onChange({ listing })}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg border border-ink/12 px-2.5 text-[0.6875rem] font-medium text-ink/55 transition-colors hover:border-ink/25 hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
