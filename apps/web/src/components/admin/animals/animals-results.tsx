import { animalsService, type Actor, type ListAnimalsQuery } from "@furescue/core";

import { Pagination } from "@/components/ui/pagination";

import { toAnimalRow } from "./animals-data";
import { AnimalsConsole } from "./animals-console";

interface AnimalsResultsProps {
  query: ListAnimalsQuery;
  actor: Actor;
  baseParams: Record<string, string>;
}

function pageHref(baseParams: Record<string, string>, page: number): string {
  const next = new URLSearchParams(baseParams);
  if (page > 1) next.set("page", String(page));
  const query = next.toString();
  return query ? `/admin/animals?${query}` : "/admin/animals";
}

export async function AnimalsResults({ query, actor, baseParams }: AnimalsResultsProps) {
  const { items, meta } = await animalsService.list(query, actor);

  return (
    <>
      <AnimalsConsole animals={items.map(toAnimalRow)} />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        itemLabel="animals"
        hrefForPage={(next) => pageHref(baseParams, next)}
        className="border-t border-ink/[0.07] px-4 py-3"
      />
    </>
  );
}
