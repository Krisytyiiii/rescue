/**
 * Rescuer home domain model.
 *
 * Mirrors the Prisma enums so the UI speaks the same vocabulary as the schema
 * (`ReportStatus`, `AssignmentStatus`, `UrgencyLevel`, `ReportSpecies`,
 * `ReportType`). Keep these in sync with `prisma/schema.prisma`.
 */

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type ReportSpecies = "dog" | "cat" | "unknown";

export type ReportType = "stray" | "injured" | "abandoned";

export type ReportStatus =
  | "submitted"
  | "verified"
  | "assigned"
  | "in_progress"
  | "rescued"
  | "unable_to_locate"
  | "rejected"
  | "closed";

export type AssignmentStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "en_route"
  | "on_site"
  | "completed"
  | "failed";

/** The single primary action for an assignment, derived from its status. */
export type NextAction =
  | "accept"
  | "decline"
  | "start_en_route"
  | "mark_on_site"
  | "complete";

/** One rescue operation as the rescuer sees it. */
export interface RescuerAssignment {
  id: string;
  reportId: string;
  reportCode: string;
  status: AssignmentStatus;
  reportStatus: ReportStatus;
  urgency: UrgencyLevel;
  species: ReportSpecies;
  reportType: ReportType;
  description: string;
  barangay: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  /** Name of the person who submitted the report. */
  reporter: string;
  /** Account of the reporter, when they have one. */
  reporterUserId: string | null;
  /** Name of the dispatcher who assigned the report, when known. */
  assignedBy: string | null;
  /** Account of the dispatcher who assigned the report. */
  assignedByUserId: string | null;
  distanceKm: number | null;
  assignedAt: string;
  completedAt: string | null;
  nextAction: NextAction | null;
}

/**
 * Raw snapshot loaded by the data layer. Grouping and counts are derived by
 * `selectRescuerHome` so the numbers always reconcile with the lists.
 */
export interface RescuerHomeData {
  /** ISO timestamp used as "now" for today's counts. */
  asOf: string;
  assignments: RescuerAssignment[];
  unreadNotifications: number;
  unreadMessages: number;
  queueCount: number;
}

export interface RescuerHomeStats {
  /** Active assignments owned by the rescuer. */
  assigned: number;
  /** Accepted, en route, or on site. */
  inProgress: number;
  completedToday: number;
}

/** One verified, unassigned report shown read-only in the rescuer queue. */
export interface QueuedReport {
  id: string;
  reportCode: string;
  reportStatus: ReportStatus;
  reportType: ReportType;
  species: ReportSpecies;
  urgency: UrgencyLevel;
  description: string;
  barangay: string | null;
  landmark: string | null;
  distanceKm: number | null;
  submittedAt: string;
  verifiedAt: string | null;
}

export interface RescuerHistoryGroup {
  key: string;
  label: string;
  entries: RescuerAssignment[];
}

export interface RescuerHistoryState {
  total: number;
  thisMonth: number;
  groups: RescuerHistoryGroup[];
}

const TERMINAL_STATUSES: readonly AssignmentStatus[] = [
  "completed",
  "failed",
  "declined",
];

/** Statuses shown on the rescuer History screen. */
export const RESCUER_HISTORY_STATUSES: readonly AssignmentStatus[] = [
  "accepted",
  "en_route",
  "on_site",
  "completed",
  "failed",
  "declined",
];

/** Verified reports awaiting dispatch, most urgent and oldest first. */
export function selectRescuerQueue(reports: QueuedReport[]): QueuedReport[] {
  return [...reports]
    .filter((report) => report.reportStatus === "verified")
    .sort((a, b) => {
      const urgency = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (urgency !== 0) return urgency;
      return (
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    });
}

/** Selected operations grouped by month, newest first. */
export function selectRescuerHistory(
  assignments: RescuerAssignment[],
  asOf: string = new Date().toISOString(),
  statuses: readonly AssignmentStatus[] = TERMINAL_STATUSES,
): RescuerHistoryState {
  const reference = new Date(asOf);
  const terminal = assignments
    .filter((assignment) => statuses.includes(assignment.status))
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.assignedAt).getTime() -
        new Date(a.completedAt ?? a.assignedAt).getTime(),
    );

  const groups: RescuerHistoryGroup[] = [];
  for (const entry of terminal) {
    const date = new Date(entry.completedAt ?? entry.assignedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    let group = groups.find((candidate) => candidate.key === key);
    if (!group) {
      group = {
        key,
        label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
        entries: [],
      };
      groups.push(group);
    }
    group.entries.push(entry);
  }

  const thisMonthKey = `${reference.getFullYear()}-${String(
    reference.getMonth() + 1,
  ).padStart(2, "0")}`;

  return {
    total: terminal.length,
    thisMonth: terminal.filter((entry) => {
      const date = new Date(entry.completedAt ?? entry.assignedAt);
      return (
        date.getFullYear() === reference.getFullYear() &&
        date.getMonth() === reference.getMonth()
      );
    }).length,
    groups: groups.sort((a, b) => b.key.localeCompare(a.key)),
  };
}

/** Filters shown on the rescuer assignments board. */
export type AssignmentBoardFilter =
  | "all"
  | "pending"
  | "active"
  | "completed"
  | "declined";

const BOARD_FILTER_STATUSES: Record<
  Exclude<AssignmentBoardFilter, "all">,
  readonly AssignmentStatus[]
> = {
  pending: ["pending"],
  active: ["accepted", "en_route", "on_site"],
  completed: ["completed", "failed"],
  declined: ["declined"],
};

/** Active work first, then offers, declined, and finished operations. */
const BOARD_STATUS_RANK: Record<AssignmentStatus, number> = {
  on_site: 0,
  en_route: 1,
  accepted: 2,
  pending: 3,
  declined: 4,
  completed: 5,
  failed: 6,
};

export interface AssignmentBoardQuery {
  search?: string;
  filter?: AssignmentBoardFilter;
}

/**
 * Pure selector for the assignments board: applies the status filter and a
 * case-insensitive search across the fields a rescuer would scan for.
 */
export function selectAssignmentBoard(
  assignments: RescuerAssignment[],
  { search = "", filter = "all" }: AssignmentBoardQuery = {},
): RescuerAssignment[] {
  const needle = search.trim().toLowerCase();

  return assignments
    .filter((assignment) => {
      if (filter !== "all") {
        const allowed = BOARD_FILTER_STATUSES[filter];
        if (!allowed.includes(assignment.status)) return false;
      }

      if (!needle) return true;

      return [
        assignment.reportCode,
        assignment.description,
        assignment.barangay ?? "",
        assignment.landmark ?? "",
        assignment.species,
        assignment.reportType,
        assignment.urgency,
        assignment.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => {
      const rank = BOARD_STATUS_RANK[a.status] - BOARD_STATUS_RANK[b.status];
      if (rank !== 0) return rank;
      return (
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );
    });
}

/** A person the rescuer can start a direct message with. */
export type RescuerContactRole = "admin" | "reporter";

export interface RescuerContact {
  userId: string;
  fullName: string;
  role: RescuerContactRole;
  /** Report codes that link this person to the rescuer's work. */
  reportCodes: string[];
}

/**
 * People attached to the rescuer's assignments: the dispatcher who assigned
 * the work and the reporter who filed it. Deduped per person.
 */
export function selectRescuerContacts(
  assignments: RescuerAssignment[],
): RescuerContact[] {
  const contacts = new Map<string, RescuerContact>();

  const add = (
    userId: string | null,
    fullName: string | null,
    role: RescuerContactRole,
    reportCode: string,
  ) => {
    if (!userId || !fullName) return;
    const existing = contacts.get(userId);
    if (existing) {
      if (!existing.reportCodes.includes(reportCode)) {
        existing.reportCodes.push(reportCode);
      }
      return;
    }
    contacts.set(userId, {
      userId,
      fullName,
      role,
      reportCodes: [reportCode],
    });
  };

  for (const assignment of assignments) {
    add(
      assignment.assignedByUserId,
      assignment.assignedBy,
      "admin",
      assignment.reportCode,
    );
    add(
      assignment.reporterUserId,
      assignment.reporter,
      "reporter",
      assignment.reportCode,
    );
  }

  return [...contacts.values()].sort((a, b) => {
    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    return a.fullName.localeCompare(b.fullName);
  });
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface RescuerHomeState {
  stats: RescuerHomeStats;
  activeAssignment: RescuerAssignment | null;
  pendingOffers: RescuerAssignment[];
  enRoute: RescuerAssignment[];
  onSite: RescuerAssignment[];
  completedToday: RescuerAssignment[];
  unreadNotifications: number;
  unreadMessages: number;
  queueCount: number;
}

/** A field action a rescuer can take on an assignment. */
export type AssignmentTransition =
  | { action: "accept" }
  | { action: "decline"; reason?: string }
  | { action: "start_en_route" }
  | { action: "mark_on_site" }
  | { action: "complete"; outcomeNotes?: string; animalsRescued?: number }
  | { action: "fail"; reason?: string };

/**
 * Inbound port: the only assignment surface view models use. The data layer
 * backs it with the live rescue API.
 */
export interface RescuerAssignmentRepository {
  loadAssignment(id: string): Promise<RescuerAssignment | null>;
  transition(
    id: string,
    transition: AssignmentTransition,
  ): Promise<RescuerAssignment>;
}

/** The primary action for a status, or `null` when the assignment is terminal. */
export function nextActionFor(status: AssignmentStatus): NextAction | null {
  switch (status) {
    case "pending":
      return "accept";
    case "accepted":
      return "start_en_route";
    case "en_route":
      return "mark_on_site";
    case "on_site":
      return "complete";
    default:
      return null;
  }
}

const TRANSITION_FROM: Record<AssignmentTransition["action"], AssignmentStatus[]> = {
  accept: ["pending"],
  decline: ["pending"],
  start_en_route: ["accepted"],
  mark_on_site: ["en_route"],
  complete: ["on_site"],
  fail: ["pending", "accepted", "en_route", "on_site"],
};

/**
 * Pure state machine for a field action. Throws when the action is not allowed
 * from the current status, mirroring the server-side guard.
 */
export function applyAssignmentTransition(
  assignment: RescuerAssignment,
  transition: AssignmentTransition,
  now: string = new Date().toISOString(),
): RescuerAssignment {
  if (!TRANSITION_FROM[transition.action].includes(assignment.status)) {
    throw new Error(
      `Cannot ${transition.action} an assignment that is ${assignment.status}.`,
    );
  }

  switch (transition.action) {
    case "accept":
      return withStatus(assignment, "accepted", "in_progress");
    case "decline":
      return withStatus(assignment, "declined", assignment.reportStatus);
    case "start_en_route":
      return withStatus(assignment, "en_route", assignment.reportStatus);
    case "mark_on_site":
      return withStatus(assignment, "on_site", assignment.reportStatus);
    case "complete":
      return {
        ...withStatus(assignment, "completed", "rescued"),
        completedAt: now,
      };
    case "fail":
      return withStatus(assignment, "failed", "unable_to_locate");
  }
}

function withStatus(
  assignment: RescuerAssignment,
  status: AssignmentStatus,
  reportStatus: ReportStatus,
): RescuerAssignment {
  return {
    ...assignment,
    status,
    reportStatus,
    nextAction: nextActionFor(status),
  };
}

const ACTIVE_STATUSES: readonly AssignmentStatus[] = [
  "pending",
  "accepted",
  "en_route",
  "on_site",
];

const EN_ROUTE_STATUSES: readonly AssignmentStatus[] = ["accepted", "en_route"];

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_RANK: Record<AssignmentStatus, number> = {
  on_site: 0,
  en_route: 1,
  accepted: 2,
  pending: 3,
  completed: 4,
  failed: 5,
  declined: 6,
};

function isSameDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isActive(assignment: RescuerAssignment): boolean {
  return ACTIVE_STATUSES.includes(assignment.status);
}

/**
 * Orders active assignments so the most urgent and furthest-along operation is
 * surfaced in the banner first.
 */
function compareActive(a: RescuerAssignment, b: RescuerAssignment): number {
  const urgency = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
  if (urgency !== 0) return urgency;

  const status = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (status !== 0) return status;

  return new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
}

/** Pure selector: raw snapshot -> presentation state for the Today screen. */
export function selectRescuerHome(data: RescuerHomeData): RescuerHomeState {
  const reference = new Date(data.asOf);
  const active = data.assignments.filter(isActive);
  const completedToday = data.assignments.filter(
    (assignment) =>
      assignment.status === "completed" &&
      assignment.completedAt !== null &&
      isSameDay(assignment.completedAt, reference),
  );

  return {
    stats: {
      assigned: active.length,
      inProgress: active.filter((assignment) =>
        EN_ROUTE_STATUSES.includes(assignment.status),
      ).length,
      completedToday: completedToday.length,
    },
    activeAssignment:
      active.length > 0 ? [...active].sort(compareActive)[0] : null,
    pendingOffers: active.filter((assignment) => assignment.status === "pending"),
    enRoute: active.filter((assignment) =>
      EN_ROUTE_STATUSES.includes(assignment.status),
    ),
    onSite: active.filter((assignment) => assignment.status === "on_site"),
    completedToday,
    unreadNotifications: data.unreadNotifications,
    unreadMessages: data.unreadMessages,
    queueCount: data.queueCount,
  };
}
