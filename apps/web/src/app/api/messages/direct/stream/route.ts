import {
  authService,
  isAppError,
  messagingService,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** How often the server checks the database for new messages. */
const POLL_MS = 1_500;
/** Keeps idle proxies from dropping the connection. */
const HEARTBEAT_MS = 20_000;

/**
 * GET /api/messages/direct/stream?userId=... - Server-sent events stream of a
 * rescuer's direct thread. Emits the full conversation whenever it changes so
 * the mobile chat updates without polling from the device.
 */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session || session.role !== "rescuer") {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return new Response("Choose a person", { status: 400 });
  }

  let actor: Actor;
  try {
    const user = await authService.me(session.sub);
    actor = {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    };
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
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
        if (heartbeat) clearInterval(heartbeat);
        request.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          // Stream may already be closed by the client.
        }
      };

      request.signal.addEventListener("abort", cleanup);

      send("ready", String(Date.now()));
      heartbeat = setInterval(() => send("ping", String(Date.now())), HEARTBEAT_MS);

      let last = "";
      const tick = async () => {
        if (closed) return;
        try {
          const conversation = await messagingService.getRescuerDirect(userId, actor);
          const next = JSON.stringify(conversation);
          if (next === last) return;
          last = next;
          send("thread", next);
        } catch (error) {
          if (isAppError(error)) {
            send("error", JSON.stringify({ code: error.code, message: error.message }));
            cleanup();
          }
          // Otherwise ignore transient database errors; the next tick retries.
        }
      };

      await tick();
      if (!closed) interval = setInterval(tick, POLL_MS);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
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
