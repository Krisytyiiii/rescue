import type {
  ReportSpecies,
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

/** Short, local-friendly date such as `Nov 22, 2026`. */
export function formatReportDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
