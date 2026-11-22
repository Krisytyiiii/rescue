import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { adoptionApplicationDataSource } from "@/data";
import type { AdoptionApplicationDataSource } from "@/data";
import type { AdoptionRequest } from "@/domain/adoptions";
import {
  dueInterviewReminders,
  isInterviewReminderDue,
} from "@/domain/interview-reminders";

/** Re-read applications once a minute so status changes stop reminders. */
const POLL_MS = 60_000;

/**
 * Watches the resident's interview-scheduled applications and surfaces a
 * snackbar ten minutes before the interview, then every five minutes until the
 * application leaves the `interview_scheduled` status.
 *
 * The snackbar stays on screen until the resident dismisses it.
 */
export function useInterviewReminderViewModel(
  data: AdoptionApplicationDataSource = adoptionApplicationDataSource,
) {
  const [reminder, setReminder] = useState<AdoptionRequest | null>(null);
  const [visible, setVisible] = useState(false);

  const shownAt = useRef(new Map<string, number>());
  const currentReminder = useRef<AdoptionRequest | null>(null);
  const mounted = useRef(true);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const show = useCallback((application: AdoptionRequest) => {
    currentReminder.current = application;
    setReminder(application);
    setVisible(true);
  }, []);

  const run = useCallback(async () => {
    let records: AdoptionRequest[];
    try {
      records = await data.loadMyApplications();
    } catch {
      // Keep the last known state on a network hiccup.
      return;
    }
    if (!mounted.current) return;

    const now = Date.now();

    // A status change ends the reminder completely.
    const activeIds = new Set(
      records
        .filter((application) => application.status === "interview_scheduled")
        .map((application) => application.id),
    );
    for (const id of shownAt.current.keys()) {
      if (!activeIds.has(id)) shownAt.current.delete(id);
    }

    const current = currentReminder.current;
    if (current) {
      const latest = records.find((application) => application.id === current.id);
      if (
        !latest ||
        latest.status !== "interview_scheduled" ||
        !isInterviewReminderDue(latest, now)
      ) {
        currentReminder.current = null;
        setReminder(null);
        dismiss();
      }
    }

    const due = dueInterviewReminders(records, now, shownAt.current);
    if (due.length === 0) return;

    const next = due[0]!;
    shownAt.current.set(next.id, now);
    show(next);
  }, [data, dismiss, show]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    const tick = () => {
      if (!cancelled) void run();
    };

    tick();
    const interval = setInterval(tick, POLL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });

    return () => {
      cancelled = true;
      mounted.current = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [run]);

  return { reminder, visible, dismiss };
}
