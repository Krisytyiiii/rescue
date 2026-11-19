"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdminSupabaseRealtimeProps {
  /** Postgres tables to watch in the `public` schema. */
  tables: readonly string[];
  channelName?: string;
}

/**
 * Subscribes to Supabase Realtime `postgres_changes` and refreshes the current
 * server-rendered admin page when a watched table changes. Refreshes are
 * coalesced so a burst of inserts only triggers one render.
 */
export function AdminSupabaseRealtime({
  tables,
  channelName = "admin-realtime",
}: AdminSupabaseRealtimeProps) {
  const router = useRouter();
  const timer = useRef<number | null>(null);
  const tableKey = tables.join(",");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      // Realtime is an enhancement; without Supabase config the page still works.
      return;
    }

    const refresh = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        router.refresh();
      }, 250);
    };

    const watched = new Set(tableKey.split(",").filter(Boolean));
    const channel = client
      .channel(channelName)
      .on("broadcast", { event: "change" }, (message) => {
        const table = (message.payload as { table?: string } | undefined)?.table;
        if (table && watched.size > 0 && !watched.has(table)) return;

        // Let mounted client components react without waiting for the
        // server round trip (for example, the open message thread).
        window.dispatchEvent(
          new CustomEvent("admin:realtime", { detail: { table } }),
        );
        refresh();
      })
      .subscribe();

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      void client.removeChannel(channel);
    };
  }, [channelName, router, tableKey]);

  return null;
}
