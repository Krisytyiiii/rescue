"use client";

import { SearchInput } from "@/components/ui/search-input";

export interface UserFilters {
  q: string;
  role: string;
  status: string;
}

export const EMPTY_USER_FILTERS: UserFilters = { q: "", role: "", status: "" };

interface UsersToolbarProps {
  filters: UserFilters;
  onChange: (patch: Partial<UserFilters>) => void;
}

const TABS = [
  { value: "", label: "All" },
  { value: "rescuer", label: "Rescuers", role: "rescuer" },
  { value: "community_user", label: "Community", role: "community_user" },
  { value: "admin", label: "Admins", role: "admin" },
  { value: "pending", label: "Pending", status: "pending" },
  { value: "suspended", label: "Suspended", status: "suspended" },
];

/** Filters an in-memory account list — no URL writes and no requests. */
export function UsersToolbar({ filters, onChange }: UsersToolbarProps) {
  const activeTab =
    filters.status === "pending" || filters.status === "suspended"
      ? filters.status
      : filters.role;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] pb-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onChange({ role: tab.role ?? "", status: tab.status ?? "" })}
              aria-pressed={active}
              className={`rounded-lg px-2.5 py-1 text-[0.75rem] font-medium transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink/50 hover:bg-ink/[0.04] hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <SearchInput
        value={filters.q}
        onValueChange={(q) => onChange({ q })}
        label="Search users"
        placeholder="Search name, email, or phone"
        className="w-full sm:w-64"
      />
    </div>
  );
}
