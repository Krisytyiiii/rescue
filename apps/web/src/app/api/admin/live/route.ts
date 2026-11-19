import { prisma } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** How often the server checks the database for changes. */
const POLL_MS = 3_000;

interface FingerprintRow {
  source: string;
  total: string;
  latest: string;
}

async function fingerprint(): Promise<string> {
  const rows = await prisma.$queryRaw<FingerprintRow[]>`
    SELECT 'reports' AS source, count(*)::text AS total, coalesce(max(updated_at)::text, '') AS latest FROM reports
    UNION ALL
    SELECT 'users', count(*)::text, coalesce(max(updated_at)::text, '') FROM users
    UNION ALL
    SELECT 'animals', count(*)::text, coalesce(max(updated_at)::text, '') FROM animals
    UNION ALL
    SELECT 'adoption_requests', count(*)::text, coalesce(max(updated_at)::text, '') FROM adoption_requests
    UNION ALL
    SELECT 'barangays', count(*)::text, coalesce(max(updated_at)::text, '') FROM barangays
    UNION ALL
    SELECT 'roles', count(*)::text, coalesce(max(updated_at)::text, '') FROM roles
  `;

  return rows.map((row) => `${row.source}:${row.total}:${row.latest}`).join("|");
}

/**
 * Server-sent events stream that pushes a `change` event whenever dashboard
 * data changes. The browser reacts by re-rendering the current server page,
 * so admins never have to refresh manually.
 */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          closed = true;
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        request.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          // Stream may already be closed by the client.
        }
      };

      request.signal.addEventListener("abort", cleanup);

      // Let the client know the stream is connected.
      send("ready", String(Date.now()));

      let last = "";
      const tick = async () => {
        if (closed) return;
        try {
          const next = await fingerprint();
          if (last === "") {
            last = next;
            return;
          }
          if (next !== last) {
            last = next;
            send("change", String(Date.now()));
          }
        } catch {
          // Ignore transient database errors; the next tick retries.
        }
      };

      await tick();
      interval = setInterval(tick, POLL_MS);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
