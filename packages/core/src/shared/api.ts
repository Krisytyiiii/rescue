import type { PageMeta, Paginated } from "./types.ts";

/** Uniform API envelope returned by every route handler. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, meta?: PageMeta): ApiSuccess<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function paginated<T>(result: Paginated<T>): ApiSuccess<T[]> {
  return { ok: true, data: result.items, meta: result.meta };
}

export function fail(code: string, message: string, details?: unknown): ApiFailure {
  return { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } };
}
