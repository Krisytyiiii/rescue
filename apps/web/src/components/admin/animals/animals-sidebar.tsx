"use client";

import {
  BadgeCheck,
  ClipboardList,
  HeartPulse,
  Home,
  LayoutGrid,
} from "lucide-react";

import type { AnimalCounts } from "./animals-types";

export type AnimalsTab =
  | "all"
  | "in_care"
  | "available"
  | "adoption_pending"
  | "adopted"
  | "pending_review";

interface AnimalsSidebarProps {
  counts: AnimalCounts;
  activeTab: AnimalsTab;
  /** Applies the tab's lifecycle/listing preset to local filter state. */
  onSelect: (tab: AnimalsTab) => void;
}

const TABS: Array<{
  id: AnimalsTab;
  label: string;
  icon: typeof LayoutGrid;
  count: (counts: AnimalCounts) => number;
}> = [
  {
    id: "all",
    label: "All animals",
    icon: LayoutGrid,
    count: (counts) => counts.total,
  },
  {
    id: "in_care",
    label: "In care",
    icon: HeartPulse,
    count: (counts) => counts.inCare,
  },
  {
    id: "available",
    label: "Available",
    icon: Home,
    count: (counts) => counts.available,
  },
  {
    id: "adoption_pending",
    label: "Adoption pending",
    icon: ClipboardList,
    count: (counts) => counts.adoptionPending,
  },
  {
    id: "adopted",
    label: "Adopted",
    icon: BadgeCheck,
    count: (counts) => counts.adopted,
  },
];

/** Vertical tab rail that filters the registry in memory. */
export function AnimalsSidebar({ counts, activeTab, onSelect }: AnimalsSidebarProps) {
  return (
    <nav aria-label="Animal filters" className="min-w-0 max-w-full lg:sticky lg:top-4">
      <p className="px-2 pb-2 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
        Browse animals
      </p>
      <ul className="flex min-w-0 max-w-full gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          const count = tab.count(counts);
          return (
            <li key={tab.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => onSelect(tab.id)}
                aria-pressed={active}
                className={`group flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[0.75rem] font-medium transition-colors lg:h-8 ${
                  active
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(20,30,25,0.06)]"
                    : "text-ink/50 hover:bg-ink/[0.03] hover:text-ink/80"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? "text-clay" : "text-ink/35"
                  }`}
                  strokeWidth={1.9}
                />
                <span className="whitespace-nowrap">{tab.label}</span>
                <span
                  className={`ml-auto hidden min-w-5 rounded-md px-1 py-0.5 text-center text-[0.625rem] font-semibold tabular-nums lg:block ${
                    active ? "bg-ink/[0.06] text-ink/60" : "text-ink/35"
                  }`}
                >
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
