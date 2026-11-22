import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  adoptionApplicationDataSource,
  chatPreviewDataSource,
  communityDataSource,
  reportHistoryDataSource,
  rescuerHomeDataSource,
} from "@/data";
import type {
  AdoptionApplicationDataSource,
  ChatPreviewDataSource,
  CommunityDataSource,
  ReportHistoryDataSource,
} from "@/data";
import type { RescuerHomeData } from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

/** How often the shell refreshes its badge counters. */
const POLL_MS = 15_000;
const SEEN_KEY = "furescue.tab-badges-seen";
const SEEN_AT_KEY = "furescue.tab-badges-seen-at";

/** Resident tabs whose badge counts items newer than the last visit. */
const RESIDENT_TIMESTAMP_TABS = ["index", "report", "animals-tab"] as const;

type TabCounts = Record<string, number>;
type SeenAt = Record<string, number>;

interface ResidentSources {
  applications?: AdoptionApplicationDataSource;
  community?: CommunityDataSource;
  previews?: ChatPreviewDataSource;
  reports?: ReportHistoryDataSource;
}

interface Options extends ResidentSources {
  home?: RescuerHomeDataSource;
}

function countsFrom(home: RescuerHomeData): TabCounts {
  return {
    index: home.unreadNotifications,
    queue: home.queueCount,
    messages: home.unreadMessages,
  };
}

function countSince<T>(
  items: readonly T[],
  getDate: (item: T) => string | null | undefined,
  since: number,
): number {
  return items.filter((item) => {
    const value = getDate(item);
    if (!value) return false;
    const time = Date.parse(value);
    return !Number.isNaN(time) && time > since;
  }).length;
}

async function readMap(key: string): Promise<Record<string, number>> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

async function writeMap(key: string, value: Record<string, number>) {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {
    // Persistence is optional; in-memory state still applies.
  }
}

function isTimestampTab(name: string): boolean {
  return (RESIDENT_TIMESTAMP_TABS as readonly string[]).includes(name);
}

/**
 * Per-tab "new since last visit" counters.
 *
 * Rescuers use their shift dashboard counters. Residents get live badges for
 * new feed posts, new report updates, new adoptable animals, and unread chat
 * messages. Counts poll in the background and are acknowledged only when the
 * matching tab is focused, so a badge cannot disappear early.
 */
export function useTabBadges(
  role: string | null,
  {
    home = rescuerHomeDataSource,
    applications = adoptionApplicationDataSource,
    community = communityDataSource,
    previews = chatPreviewDataSource,
    reports = reportHistoryDataSource,
  }: Options = {},
) {
  const [counts, setCounts] = useState<TabCounts>({});
  const [seen, setSeen] = useState<TabCounts>({});
  const seenAt = useRef<SeenAt>({});

  useEffect(() => {
    let active = true;
    void Promise.all([readMap(SEEN_KEY), readMap(SEEN_AT_KEY)]).then(
      ([storedSeen, storedSeenAt]) => {
        if (!active) return;
        setSeen(storedSeen);
        seenAt.current = storedSeenAt;
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const residentCounts = useCallback(async (): Promise<TabCounts> => {
    const [posts, history, animals, chatPreviews] = await Promise.all([
      community.loadFeed(),
      reports.listMyReports(),
      applications.loadAvailableAnimals(),
      previews.loadPreviews(),
    ]);

    const now = Date.now();
    let initialized = false;
    for (const tab of RESIDENT_TIMESTAMP_TABS) {
      if (!seenAt.current[tab]) {
        seenAt.current[tab] = now;
        initialized = true;
      }
    }
    if (initialized) void writeMap(SEEN_AT_KEY, seenAt.current);

    const since = (tab: string) => seenAt.current[tab] ?? now;

    return {
      index: countSince(posts, (post) => post.createdAt, since("index")),
      report: countSince(
        history,
        (report) => report.latestUpdate?.changedAt,
        since("report"),
      ),
      "animals-tab": countSince(
        animals,
        (animal) => animal.createdAt,
        since("animals-tab"),
      ),
      messages: chatPreviews.reduce(
        (total, preview) => total + preview.unreadCount,
        0,
      ),
    };
  }, [applications, community, previews, reports]);

  const refresh = useCallback(async () => {
    if (role === "rescuer") {
      try {
        setCounts(countsFrom(await home.loadHome()));
      } catch {
        // Badges are an enhancement; keep the last known values.
      }
      return;
    }

    if (role === "community_user") {
      try {
        setCounts(await residentCounts());
      } catch {
        // Keep the last known values on a network hiccup.
      }
      return;
    }

    setCounts({});
  }, [home, residentCounts, role]);

  useEffect(() => {
    if (role !== "rescuer" && role !== "community_user") {
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
      if (role === "community_user" && isTimestampTab(name)) {
        seenAt.current = { ...seenAt.current, [name]: Date.now() };
        void writeMap(SEEN_AT_KEY, seenAt.current);
        setCounts((current) => {
          if (!current[name]) return current;
          return { ...current, [name]: 0 };
        });
        return;
      }

      setSeen((current) => {
        const next = { ...current, [name]: counts[name] ?? 0 };
        void writeMap(SEEN_KEY, next);
        return next;
      });
    },
    [counts, role],
  );

  const unseen = (name: string) => {
    if (role === "community_user" && isTimestampTab(name)) {
      return counts[name] ?? 0;
    }
    return Math.max(0, (counts[name] ?? 0) - (seen[name] ?? 0));
  };

  return { unseen, markSeen };
}
