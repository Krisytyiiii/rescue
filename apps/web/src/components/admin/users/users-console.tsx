"use client";

import { UserX } from "lucide-react";
import { useMemo, useState } from "react";

import { Pagination } from "@/components/ui/pagination";
import { SearchEmpty } from "@/components/ui/search-empty";

import { UsersTable } from "./users-table";
import {
  EMPTY_USER_FILTERS,
  UsersToolbar,
  type UserFilters,
} from "./users-toolbar";
import type { UserRow } from "./users-types";

const PAGE_SIZE = 10;

function matchesQuery(row: UserRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [row.fullName, row.email, row.phoneNumber ?? "", row.barangay ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

interface UsersConsoleProps {
  rows: UserRow[];
  currentUserId: string;
}

/**
 * Client-side account directory. Rows arrive once from the server, then search
 * and role/status filters narrow them synchronously as the user types.
 */
export function UsersConsole({ rows, currentUserId }: UsersConsoleProps) {
  const [filters, setFilters] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!filters.role || row.role === filters.role) &&
          (!filters.status || row.accountStatus === filters.status) &&
          matchesQuery(row, filters.q),
      ),
    [rows, filters],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const first = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const visible = filtered.slice(first === 0 ? 0 : first - 1, last);
  const hasFilters = Object.values(filters).some(Boolean);

  function patch(next: Partial<UserFilters>) {
    setPage(1);
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-4">
        <UsersToolbar filters={filters} onChange={patch} />
      </div>

      {filtered.length === 0 ? (
        <SearchEmpty
          className="flex-1"
          icon={hasFilters ? undefined : UserX}
          title={hasFilters ? "No users match your search" : "No accounts yet"}
          description={
            hasFilters
              ? "Try a different name, email, or phone, or clear a tab."
              : "New community and rescuer accounts will appear here."
          }
          onClear={
            hasFilters
              ? () => {
                  setPage(1);
                  setFilters(EMPTY_USER_FILTERS);
                }
              : undefined
          }
          clearLabel="Clear filters"
        />
      ) : (
        <>
          <p className="px-4 pt-1 text-[0.6875rem] text-ink/40">
            Showing {first}–{last} of {filtered.length}
          </p>

          <UsersTable rows={visible} currentUserId={currentUserId} />

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            itemLabel="users"
            onPageChange={setPage}
            className="flex-wrap border-t border-ink/[0.07] px-4 py-3"
          />
        </>
      )}
    </div>
  );
}
