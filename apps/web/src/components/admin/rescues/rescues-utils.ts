import type { BadgeTone } from "@/components/ui/badge";
import type {
  ReportMarkerRow,
  RescueFeedEntry,
  RescueOperationRow,
  UnassignedReportRow,
} from "@furescue/core";

export type RescueFilter =
  | "all"
  | "unassigned"
  | "pending"
  | "infield"
  | "completed"
  | "issues";

export const FILTERS: Array<{ id: RescueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unassigned", label: "Unassigned" },
  { id: "pending", label: "Pending" },
  { id: "infield", label: "In field" },
  { id: "completed", label: "Completed" },
  { id: "issues", label: "Issues" },
];

export const ASSIGNMENT_META: Record<
  string,
  { label: string; tone: BadgeTone; pin: string; text: string }
> = {
  pending: { label: "Pending", tone: "pending", pin: "#c99a4e", text: "text-[#7a5212]" },
  accepted: { label: "Accepted", tone: "info", pin: "#1f7a4d", text: "text-[#16603b]" },
  en_route: { label: "En route", tone: "progress", pin: "#2f8f63", text: "text-[#1c5f42]" },
  on_site: { label: "On site", tone: "progress", pin: "#247a54", text: "text-[#1c5f42]" },
  completed: { label: "Completed", tone: "success", pin: "#15803d", text: "text-[#166534]" },
  declined: { label: "Declined", tone: "warning", pin: "#b45309", text: "text-[#92400e]" },
  failed: { label: "Failed", tone: "danger", pin: "#b42318", text: "text-[#991b1b]" },
};

export const URGENCY_META: Record<
  string,
  { label: string; rule: string; tone: BadgeTone }
> = {
  critical: { label: "Critical", rule: "bg-[#b42318]", tone: "danger" },
  high: { label: "High", rule: "bg-[#b45309]", tone: "warning" },
  medium: { label: "Medium", rule: "bg-[#c99a4e]", tone: "pending" },
  low: { label: "Low", rule: "bg-ink/25", tone: "neutral" },
};

export const REPORT_STATUS_META: Record<
  string,
  { label: string; pin: string; tone: BadgeTone }
> = {
  submitted: { label: "Submitted", pin: "#c99a4e", tone: "pending" },
  verified: { label: "Verified", pin: "#1f7a4d", tone: "info" },
  assigned: { label: "Assigned", pin: "#2f8f63", tone: "progress" },
  in_progress: { label: "In progress", pin: "#247a54", tone: "progress" },
  rescued: { label: "Rescued", pin: "#15803d", tone: "success" },
  unable_to_locate: { label: "Unable to locate", pin: "#b45309", tone: "warning" },
  rejected: { label: "Rejected", pin: "#b42318", tone: "danger" },
  closed: { label: "Closed", pin: "#5f7a6b", tone: "neutral" },
};

export const REPORT_STATUS_ORDER = [
  "submitted",
  "verified",
  "assigned",
  "in_progress",
  "rescued",
  "unable_to_locate",
  "rejected",
  "closed",
] as const;

export function reportStatusMeta(status: string) {
  return REPORT_STATUS_META[status] ?? REPORT_STATUS_META.closed;
}

export function matchesReportQuery(report: ReportMarkerRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    report.reportCode,
    report.description,
    report.locationLandmark ?? "",
    report.barangay ?? "",
    report.reporter,
    report.rescuer?.fullName ?? "",
    report.reportStatus,
    report.species,
    report.reportType,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function assignmentMeta(status: string) {
  return ASSIGNMENT_META[status] ?? ASSIGNMENT_META.pending;
}

export function urgencyMeta(level: string) {
  return URGENCY_META[level] ?? URGENCY_META.low;
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

const clockFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return timeFormatter.format(new Date(value));
}

export function formatClock(value: string | null): string {
  if (!value) return "—";
  return clockFormatter.format(new Date(value));
}

/** Coarse elapsed label that only changes by the minute/hour, not every second. */
export function elapsedLabel(from: string | null, now: number | null): string {
  if (!from || now === null) return "";
  const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export function isInField(operation: RescueOperationRow): boolean {
  return ["accepted", "en_route", "on_site"].includes(operation.assignmentStatus);
}

export function isIssue(operation: RescueOperationRow): boolean {
  return operation.assignmentStatus === "declined" || operation.assignmentStatus === "failed";
}

export function matchesFilter(operation: RescueOperationRow, filter: RescueFilter): boolean {
  switch (filter) {
    case "pending":
      return operation.assignmentStatus === "pending";
    case "infield":
      return isInField(operation);
    case "completed":
      return operation.assignmentStatus === "completed";
    case "issues":
      return isIssue(operation);
    case "unassigned":
      return false;
    default:
      return true;
  }
}

export function matchesQuery(
  item: RescueOperationRow | UnassignedReportRow,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    "reportCode" in item ? item.reportCode : "",
    item.description,
    item.locationLandmark ?? "",
    item.barangay ?? "",
    "rescuer" in item ? (item.rescuer?.fullName ?? "") : "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export const FEED_META: Record<
  RescueFeedEntry["kind"],
  { label: string; dot: string }
> = {
  assigned: { label: "assigned", dot: "bg-[#c99a4e]" },
  accepted: { label: "accepted", dot: "bg-[#1f7a4d]" },
  arrived: { label: "arrived on site", dot: "bg-[#2f8f63]" },
  completed: { label: "completed", dot: "bg-[#15803d]" },
  failed: { label: "marked failed", dot: "bg-[#b42318]" },
  declined: { label: "declined", dot: "bg-[#b45309]" },
};
