import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string = "REQUEST_FAILED",
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  /** Identifies the mobile client so the API returns tokens instead of cookies. */
  mobile?: boolean;
  networkMessage: string;
  fallbackMessage: string;
}

/** Single HTTP entry point: unwraps the API envelope and normalises errors. */
export async function requestJson<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.mobile) headers["x-client"] = "mobile";

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(options.networkMessage, "NETWORK_ERROR");
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !envelope?.ok || envelope.data === undefined) {
    throw new ApiError(
      envelope?.error?.message ?? options.fallbackMessage,
      envelope?.error?.code,
      response.status,
    );
  }

  return envelope.data;
}
