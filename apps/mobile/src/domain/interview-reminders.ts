import type { AdoptionRequest } from "./adoptions";

/** Start reminding ten minutes before the scheduled interview. */
export const INTERVIEW_REMINDER_LEAD_MS = 10 * 60 * 1000;

/** Keep reminding every five minutes while the status stays unchanged. */
export const INTERVIEW_REMINDER_REPEAT_MS = 5 * 60 * 1000;

/** The interview moment in epoch milliseconds, or null when it has no date. */
export function interviewTime(application: AdoptionRequest): number | null {
  if (!application.interviewSchedule) return null;
  const time = Date.parse(application.interviewSchedule);
  return Number.isNaN(time) ? null : time;
}

/**
 * A reminder is due from ten minutes before the interview onwards, as long as
 * the application is still waiting on that interview.
 */
export function isInterviewReminderDue(
  application: AdoptionRequest,
  now: number,
): boolean {
  if (application.status !== "interview_scheduled") return false;
  const time = interviewTime(application);
  if (time === null) return false;
  return now >= time - INTERVIEW_REMINDER_LEAD_MS;
}

/**
 * Reminders to surface right now, earliest interview first. `lastShownAt` keeps
 * the five-minute repeat window so the snackbar does not fire every poll.
 */
export function dueInterviewReminders(
  applications: AdoptionRequest[],
  now: number,
  lastShownAt: ReadonlyMap<string, number>,
): AdoptionRequest[] {
  return applications
    .filter((application) => isInterviewReminderDue(application, now))
    .filter((application) => {
      const lastShown = lastShownAt.get(application.id);
      return (
        lastShown === undefined ||
        now - lastShown >= INTERVIEW_REMINDER_REPEAT_MS
      );
    })
    .sort((a, b) => (interviewTime(a) ?? 0) - (interviewTime(b) ?? 0));
}
