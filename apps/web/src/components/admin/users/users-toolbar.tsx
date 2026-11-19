"use client";

import { useRouter } from "next/navigation";

import { SearchInput } from "@/components/ui/search-input";

interface UsersToolbarProps {
  q: string;
  role: string;
  status: string;
}

const TABS = [
  { value: "", label: "All" },
  { value: "rescuer", label: "Rescuers", role: "rescuer" },
  { value: "community_user", label: "Community", role: "community_user" },
  { value: "admin", label: "Admins", role: "admin" },
  { value: "pending", label: "Pending", status: "pending" },
  { value: "suspended", label: "Suspended", status: "suspended" },
];

/** Filters applied instantly through the URL — no submit button needed. */
export function UsersToolbar({ q, role, status }: UsersToolbarProps) {
  const router = useRouter();

  function apply(overrides: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(overrides)) {
      const trimmed = value.trim();
      if (trimmed) next.set(key, trimmed);
      else next.delete(key);
    }
    next.delete("page");

    const query = next.toString();
    router.replace(query ? `/admin/users?${query}` : "/admin/users", { scroll: false });
  }

  const activeTab = status === "pending" || status === "suspended" ? status : role;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] pb-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                apply({
                  role: tab.role ?? "",
                  status: tab.status ?? "",
                });
              }}
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
        basePath="/admin/users"
        defaultValue={q}
        label="Search users"
        placeholder="Search name, email, or phone"
        className="w-full sm:w-64"
      />
    </div>
  );
}
