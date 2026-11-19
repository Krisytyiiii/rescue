interface Page<T> {
  items: T[];
  meta: { hasNext: boolean };
}

/**
 * Pulls every page of a list once on the server so the client console can
 * filter, search, and paginate in memory without further requests.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
  pageSize = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  for (;;) {
    const result = await fetchPage(page, pageSize);
    items.push(...result.items);
    if (!result.meta.hasNext) return items;
    page += 1;
  }
}
