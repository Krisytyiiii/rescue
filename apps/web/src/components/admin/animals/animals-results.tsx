import Link from "next/link";

import { animalsService, type Actor, type ListAnimalsQuery } from "@furescue/core";

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

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-ink/[0.07] px-4 py-3">
          <p className="text-[0.75rem] text-ink/45">
            Page {meta.page} of {meta.totalPages} · {meta.total} animals
          </p>
          <div className="flex items-center gap-2">
            {meta.hasPrevious ? (
              <Link
                href={pageHref(baseParams, meta.page - 1)}
                className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-lg border border-ink/[0.06] px-3 text-[0.75rem] font-medium text-ink/25">
                Previous
              </span>
            )}
            {meta.hasNext ? (
              <Link
                href={pageHref(baseParams, meta.page + 1)}
                className="inline-flex h-8 items-center rounded-lg border border-ink/10 px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-lg border border-ink/[0.06] px-3 text-[0.75rem] font-medium text-ink/25">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
