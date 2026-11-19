"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Subscribes to the admin live-updates stream and refreshes the current server
 * page whenever the server reports that dashboard data changed.
 */
export function AdminLiveRefresh() {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource("/api/admin/live");

    source.addEventListener("change", () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
      // Coalesce bursts of changes into a single refresh.
      timer.current = window.setTimeout(() => {
        timer.current = null;
        router.refresh();
      }, 250);
    });

    return () => {
      source.close();
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [router]);

  return null;
}
