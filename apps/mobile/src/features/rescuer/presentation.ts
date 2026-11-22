import type {
  AssignmentStatus,
  NextAction,
  ReportSpecies,
  ReportStatus,
  ReportType,
  RescuerAssignment,
  UrgencyLevel,
} from "@/domain/rescuer";

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const URGENCY_COLOR: Record<UrgencyLevel, string> = {
  critical: "#FF8F7A",
  high: "#F2B264",
  medium: "#7CC79A",
  low: "rgba(255,255,255,0.7)",
};

export const ACTION_LABEL: Record<NextAction, string> = {
  accept: "Accept",
  decline: "Decline",
  start_en_route: "Start driving",
  mark_on_site: "Mark on site",
  complete: "Complete",
};

export const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: "Offered",
  accepted: "Accepted",
  declined: "Declined",
  en_route: "En route",
  on_site: "On site",
  completed: "Completed",
  failed: "Failed",
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  stray: "Stray",
  injured: "Injured",
  abandoned: "Abandoned",
};

export const SPECIES_LABEL: Record<ReportSpecies, string> = {
  dog: "Dog",
  cat: "Cat",
  unknown: "Unknown animal",
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  submitted: "Submitted",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In progress",
  rescued: "Rescued",
  unable_to_locate: "Unable to locate",
  rejected: "Rejected",
  closed: "Closed",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

export function formatToday(): string {
  const now = new Date();
  return `${WEEKDAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

export function formatElapsed(iso: string): string {  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function speciesLabel(assignment: RescuerAssignment): string {
  return speciesText(assignment.species, assignment.reportType);
}

export function speciesText(
  species: RescuerAssignment["species"],
  reportType: RescuerAssignment["reportType"],
): string {
  const animal = species === "unknown" ? "Animal" : capitalize(species);
  return `${animal} · ${capitalize(reportType)}`;
}

/** One line in an operation's system/rescuer activity thread. */
export interface HistoryThreadEntry {
  actor: "system" | "rescuer";
  label: string;
  detail?: string;
}

/**
 * Builds the ledger view of a completed operation: what the system recorded
 * about the report and what the rescuer did in response.
 */
export function historyThread(entry: RescuerAssignment): HistoryThreadEntry[] {
  const thread: HistoryThreadEntry[] = [
    {
      actor: "system",
      label: "Report received",
      detail: `${speciesLabel(entry)} · ${entry.barangay ?? "Unmapped"} · ${
        URGENCY_LABEL[entry.urgency]
      } priority · Reported by ${entry.reporter || "Anonymous"}`,
    },
    {
      actor: "system",
      label: "Dispatch assigned this report to you",
      detail: `Assigned ${formatElapsed(entry.assignedAt)}`,
    },
  ];

  if (entry.status === "declined") {
    thread.push({
      actor: "rescuer",
      label: "You declined the offer",
      detail: "Returned to dispatch for reassignment",
    });
  } else {
    thread.push({ actor: "rescuer", label: "You accepted the assignment" });
  }

  if (entry.status === "completed") {
    thread.push({
      actor: "rescuer",
      label: "You completed the rescue",
      detail: entry.completedAt
        ? `Closed ${formatShortDate(entry.completedAt)}`
        : undefined,
    });
  }

  if (entry.status === "failed") {
    thread.push({
      actor: "rescuer",
      label: "You reported the animal could not be located",
    });
  }

  if (
    entry.status !== "completed" &&
    entry.status !== "failed" &&
    entry.status !== "declined"
  ) {
    thread.push({
      actor: "system",
      label: "Assignment in progress",
      detail: `Report status · ${REPORT_STATUS_LABEL[entry.reportStatus]}`,
    });
    return thread;
  }

  thread.push(
    entry.status === "declined"
      ? {
          actor: "system",
          label: "Report returned to dispatch",
          detail: `Report status · ${REPORT_STATUS_LABEL[entry.reportStatus]}`,
        }
      : {
          actor: "system",
          label: "Report closed",
          detail: `Outcome · ${STATUS_LABEL[entry.status]}`,
        },
  );

  return thread;
}
