"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimalsConsole } from "./animals-console";
import { AnimalsSidebar, type AnimalsTab } from "./animals-sidebar";
import {
  AnimalsToolbar,
  EMPTY_ANIMAL_FILTERS,
  type AnimalFilters,
} from "./animals-toolbar";
import type { AnimalCounts, AnimalRow } from "./animals-types";

const PAGE_SIZE = 12;

function matchesQuery(animal: AnimalRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    animal.animalCode,
    animal.name ?? "",
    animal.description ?? "",
    animal.breedType,
    animal.colorMarkings ?? "",
    animal.microchipNo ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

/** Which sidebar preset (if any) the current filters represent. */
function tabForFilters(filters: AnimalFilters): AnimalsTab {
  if (filters.listing === "pending_review" && !filters.lifecycle) return "pending_review";
  switch (filters.lifecycle) {
    case "under_care":
      return "in_care";
    case "available":
      return "available";
    case "adoption_pending":
      return "adoption_pending";
    case "adopted":
      return "adopted";
    default:
      return "all";
  }
}

function presetForTab(tab: AnimalsTab): Pick<AnimalFilters, "lifecycle" | "listing"> {
  switch (tab) {
    case "in_care":
      return { lifecycle: "under_care", listing: "" };
    case "available":
      return { lifecycle: "available", listing: "" };
    case "adoption_pending":
      return { lifecycle: "adoption_pending", listing: "" };
    case "adopted":
      return { lifecycle: "adopted", listing: "" };
    case "pending_review":
      return { lifecycle: "", listing: "pending_review" };
    default:
      return { lifecycle: "", listing: "" };
  }
}

interface AnimalsWorkbenchProps {
  animals: AnimalRow[];
  counts: AnimalCounts;
}

/**
 * Client-side animal registry. The full list arrives once from the server, so
 * the sidebar, filters, search, and pagination all resolve instantly in memory.
 */
export function AnimalsWorkbench({ animals, counts }: AnimalsWorkbenchProps) {
  const [filters, setFilters] = useState<AnimalFilters>(EMPTY_ANIMAL_FILTERS);
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, Partial<AnimalRow>>>({});
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Fresh server data replaces optimistic overrides.
  useEffect(() => {
    setOverrides({});
    setRemovedIds(new Set());
  }, [animals]);

  const merged = useMemo(
    () =>
      animals
        .filter((animal) => !removedIds.has(animal.id))
        .map((animal) =>
          overrides[animal.id] ? { ...animal, ...overrides[animal.id] } : animal,
        ),
    [animals, overrides, removedIds],
  );

  const filtered = useMemo(
    () =>
      merged.filter(
        (animal) =>
          (!filters.species || animal.species === filters.species) &&
          (!filters.sex || animal.sex === filters.sex) &&
          (!filters.size || animal.size === filters.size) &&
          (!filters.lifecycle || animal.lifecycleStatus === filters.lifecycle) &&
          (!filters.listing || animal.listingStatus === filters.listing) &&
          matchesQuery(animal, filters.q),
      ),
    [merged, filters],
  );

  const hasFilters = Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const first = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const visible = filtered.slice(first === 0 ? 0 : first - 1, last);

  function patch(next: Partial<AnimalFilters>) {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  }

  function applyPatch(id: string, changes: Partial<AnimalRow>) {
    setOverrides((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
  }

  function applyRemove(id: string, removed: boolean) {
    setRemovedIds((current) => {
      const next = new Set(current);
      if (removed) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <>
      <aside className="border-b border-ink/[0.07] bg-ink/[0.012] p-2.5 lg:border-b-0 lg:border-r">
        <AnimalsSidebar
          counts={counts}
          activeTab={tabForFilters(filters)}
          onSelect={(tab) => {
            setPage(1);
            setFilters((current) => ({ ...current, ...presetForTab(tab) }));
          }}
        />
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="border-b border-ink/[0.07] px-4 py-3.5">
          <AnimalsToolbar
            filters={filters}
            onChange={patch}
            onClear={() => {
              setPage(1);
              setFilters(EMPTY_ANIMAL_FILTERS);
            }}
          />
        </div>

        <AnimalsConsole
          animals={visible}
          hasFilters={hasFilters}
          onClearFilters={() => {
            setPage(1);
            setFilters(EMPTY_ANIMAL_FILTERS);
          }}
          onOptimisticPatch={applyPatch}
          onOptimisticRemove={applyRemove}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-ink/[0.07] px-4 py-3">
            <p className="text-[0.75rem] text-ink/45">
              Page {currentPage} of {totalPages} · {filtered.length} animals
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors enabled:hover:border-ink/20 enabled:hover:text-ink disabled:border-ink/[0.06] disabled:text-ink/25"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors enabled:hover:border-ink/20 enabled:hover:text-ink disabled:border-ink/[0.06] disabled:text-ink/25"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
