import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { rescuerHomeDataSource } from "@/data";
import type { RescuerHomeData } from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

/** How often the shell refreshes its badge counters. */
const POLL_MS = 15_000;
const SEEN_KEY = "furescue.tab-badges-seen";

type TabCounts = Record<string, number>;

function countsFrom(home: RescuerHomeData): TabCounts {
  return {
    index: home.unreadNotifications,
    queue: home.queueCount,
    messages: home.unreadMessages,
  };
}

async function readSeen(): Promise<TabCounts> {
  try {
    const raw = await SecureStore.getItemAsync(SEEN_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as TabCounts) : {};
  } catch {
    return {};
  }
}

/**
 * Per-tab "new since last visit" counters. Counts poll in the background and
 * are acknowledged only when the matching tab is focused, so a badge cannot
 * disappear before the user reaches that screen.
 */
export function useTabBadges(
  role: string | null,
  data: RescuerHomeDataSource = rescuerHomeDataSource,
) {
  const [counts, setCounts] = useState<TabCounts>({});
  const [seen, setSeen] = useState<TabCounts>({});

  useEffect(() => {
    let active = true;
    void readSeen().then((stored) => {
      if (active) setSeen(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (role !== "rescuer") return;

    try {
      setCounts(countsFrom(await data.loadHome()));
    } catch {
      // Badges are an enhancement; keep the last known values.
    }
  }, [data, role]);

  useEffect(() => {
    if (role !== "rescuer") {
      setCounts({});
      return;
    }

    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh, role]);

  const markSeen = useCallback(
    (name: string) => {
      setSeen((current) => {
        const next = { ...current, [name]: counts[name] ?? 0 };
        void SecureStore.setItemAsync(SEEN_KEY, JSON.stringify(next)).catch(
          () => {
            // Persistence is optional; in-memory seen counts still apply.
          },
        );
        return next;
      });
    },
    [counts],
  );

  const unseen = (name: string) =>
    Math.max(0, (counts[name] ?? 0) - (seen[name] ?? 0));

  return { unseen, markSeen };
}
