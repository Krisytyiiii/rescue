import type { AssignmentStatus } from "@/domain/rescuer";
import type {
  MyReport,
  ReportSpecies,
  ReportTimelineEvent,
  ReportType,
  UrgencyLevel,
} from "@/domain/report-submission";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  stray: "Stray",
  injured: "Injured",
  abandoned: "Abandoned",
};

export const SPECIES_LABEL: Record<ReportSpecies, string> = {
  dog: "Dog",
  cat: "Cat",
  unknown: "Not sure",
};

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Plain-language labels for the rescue operation's field status. */
export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Awaiting rescuer response",
  accepted: "Accepted by rescuer",
  declined: "Declined by rescuer",
  en_route: "Rescuer on the way",
  on_site: "Rescuer on site",
  completed: "Rescue completed",
  failed: "Rescue unsuccessful",
};

/** Short, local-friendly date such as `Nov 22, 2026`. */
export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Date and time such as `Nov 22, 2026 · 3:42 PM`. */
export function formatReportDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, " ");
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${time}`;
}

/**
 * Chronological case trail. The server sends newest first, and older reports
 * may predate history logging, so the submission is always the base event.
 */
export function reportTimeline(report: MyReport): ReportTimelineEvent[] {
  const events = [...report.statusHistory].sort(
    (a, b) =>
      new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  if (!events.some((event) => event.status === "submitted")) {
    events.unshift({
      status: "submitted",
      previousStatus: null,
      remarks: null,
      changedAt: report.submittedAt,
      changedBy: null,
    });
  }

  return events;
}
