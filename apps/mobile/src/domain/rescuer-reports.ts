import type {
  ReportSpecies,
  RescuerAssignment,
  UrgencyLevel,
} from "./rescuer";

/**
 * All-time field numbers shown on the profile reports banner. Kept separate
 * from the full insights so the profile only computes what it renders.
 */
export interface RescuerReportSummary {
  totalCompleted: number;
  thisMonthCompleted: number;
  /** Completed / (completed + failed), 0-100. Declined offers are excluded. */
  successRate: number;
}

export interface ReportSegment {
  key: string;
  label: string;
  value: number;
  /** Share of the relevant total, 0-100. */
  share: number;
}

export interface MonthlyReportPoint {
  key: string;
  label: string;
  completed: number;
  failed: number;
}

export interface RescuerReportInsights extends RescuerReportSummary {
  totalFailed: number;
  totalDeclined: number;
  activeCount: number;
  /** Mean assigned-to-completed time in hours, or null when unavailable. */
  avgCompletionHours: number | null;
  species: ReportSegment[];
  urgency: ReportSegment[];
  /** Oldest to newest, including months with no activity. */
  months: MonthlyReportPoint[];
  /** Five most recently completed rescues. */
  recent: RescuerAssignment[];
}

const ACTIVE_STATUSES = ["pending", "accepted", "en_route", "on_site"];

const SPECIES_LABEL: Record<ReportSpecies, string> = {
  dog: "Dogs",
  cat: "Cats",
  unknown: "Unknown",
};

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

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

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function completedAt(assignment: RescuerAssignment): number {
  return new Date(assignment.completedAt ?? assignment.assignedAt).getTime();
}

function share(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

/** Profile banner: three headline numbers, no chart work. */
export function selectRescuerReportSummary(
  assignments: RescuerAssignment[],
  asOf: string = new Date().toISOString(),
): RescuerReportSummary {
  const reference = new Date(asOf);
  const referenceKey = monthKey(reference);
  const completed = assignments.filter(
    (assignment) => assignment.status === "completed",
  );
  const failed = assignments.filter(
    (assignment) => assignment.status === "failed",
  );

  return {
    totalCompleted: completed.length,
    thisMonthCompleted: completed.filter(
      (assignment) =>
        assignment.completedAt && monthKey(new Date(assignment.completedAt)) === referenceKey,
    ).length,
    successRate: share(completed.length, completed.length + failed.length),
  };
}

/** Full all-time report screen state, derived from the rescuer's operations. */
export function selectRescuerReportInsights(
  assignments: RescuerAssignment[],
  asOf: string = new Date().toISOString(),
): RescuerReportInsights {
  const summary = selectRescuerReportSummary(assignments, asOf);
  const completed = assignments.filter(
    (assignment) => assignment.status === "completed",
  );
  const failed = assignments.filter(
    (assignment) => assignment.status === "failed",
  );
  const declined = assignments.filter(
    (assignment) => assignment.status === "declined",
  );
  const active = assignments.filter((assignment) =>
    ACTIVE_STATUSES.includes(assignment.status),
  );

  const durations = completed
    .filter((assignment) => assignment.completedAt)
    .map(
      (assignment) =>
        (new Date(assignment.completedAt!).getTime() -
          new Date(assignment.assignedAt).getTime()) /
        3_600_000,
    )
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  const speciesValues: Record<ReportSpecies, number> = {
    dog: 0,
    cat: 0,
    unknown: 0,
  };
  const urgencyValues: Record<UrgencyLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const assignment of completed) {
    speciesValues[assignment.species] += 1;
    urgencyValues[assignment.urgency] += 1;
  }

  const reference = new Date(asOf);
  const months: MonthlyReportPoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const cursor = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
    const key = monthKey(cursor);
    months.push({
      key,
      label: MONTHS[cursor.getMonth()] ?? "",
      completed: completed.filter(
        (assignment) =>
          assignment.completedAt &&
          monthKey(new Date(assignment.completedAt)) === key,
      ).length,
      failed: failed.filter(
        (assignment) =>
          assignment.completedAt &&
          monthKey(new Date(assignment.completedAt)) === key,
      ).length,
    });
  }

  return {
    ...summary,
    totalFailed: failed.length,
    totalDeclined: declined.length,
    activeCount: active.length,
    avgCompletionHours:
      durations.length > 0
        ? durations.reduce((total, hours) => total + hours, 0) / durations.length
        : null,
    species: (Object.keys(speciesValues) as ReportSpecies[]).map((key) => ({
      key,
      label: SPECIES_LABEL[key],
      value: speciesValues[key],
      share: share(speciesValues[key], completed.length),
    })),
    urgency: (["critical", "high", "medium", "low"] as UrgencyLevel[]).map(
      (key) => ({
        key,
        label: URGENCY_LABEL[key],
        value: urgencyValues[key],
        share: share(urgencyValues[key], completed.length),
      }),
    ),
    months,
    recent: completed
      .filter((assignment) => assignment.completedAt)
      .sort((a, b) => completedAt(b) - completedAt(a))
      .slice(0, 5),
  };
}
