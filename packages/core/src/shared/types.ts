import type { RoleName } from "../generated/prisma/enums.ts";

/** The authenticated principal passed from the HTTP layer into services. */
export interface Actor {
  userId: string;
  role: RoleName;
  barangayId: number | null;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Common service execution context (request id, IP, actor). */
export interface ServiceContext {
  actor?: Actor;
  ipAddress?: string;
  requestId?: string;
}

export type SortDirection = "asc" | "desc";

export type Nullable<T> = T | null;
