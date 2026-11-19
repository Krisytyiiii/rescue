"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TabFilters } from "@/components/ui/tab-filters";

export type AdoptionView = "animals" | "applications";

interface AdoptionViewTabsProps {
  value: AdoptionView;
  animalCount: number;
  applicationCount: number;
}

/** Top-level Adoption animals / Applications switch, kept in the page URL. */
export function AdoptionViewTabs({
  value,
  animalCount,
  applicationCount,
}: AdoptionViewTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(next: AdoptionView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "applications") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    params.delete("q");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-xl border border-ink/[0.08] bg-white p-1.5 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <TabFilters
        ariaLabel="Adoption sections"
        value={value}
        onChange={change}
        options={[
          { id: "animals", label: "Adoption animals", count: animalCount },
          { id: "applications", label: "Applications", count: applicationCount },
        ]}
      />
    </div>
  );
}
