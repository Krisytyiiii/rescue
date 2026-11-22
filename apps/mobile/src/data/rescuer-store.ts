import {
  applyAssignmentTransition,
  nextActionFor,
  type AssignmentTransition,
  type QueuedReport,
  type RescuerAssignment,
} from "@/domain/rescuer";

/**
 * In-memory placeholder for the rescue-operations data layer. Both the home
 * screen and the assignment repository read from here, so field actions are
 * reflected when the Today screen regains focus. Swap this module for the real
 * HTTP gateway in Phase E.
 */

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** A timestamp earlier today, clamped so it never slips into yesterday. */
function earlierToday(hours: number): string {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidate = new Date(now.getTime() - hours * 3_600_000);
  return (candidate < startOfDay ? startOfDay : candidate).toISOString();
}

function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
}

let assignments: RescuerAssignment[] = [
  {
    id: "assignment-1",
    reportId: "report-1",
    reportCode: "RPT-2026-2481",
    status: "pending",
    reportStatus: "assigned",
    urgency: "critical",
    species: "dog",
    reportType: "injured",
    description: "Aspin pup with a possible fracture, calmer now",
    barangay: "Barangay Central",
    landmark: "Purok 4, near the covered court",
    latitude: 7.0731,
    longitude: 125.6128,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 2.4,
    assignedAt: minutesAgo(18),
    completedAt: null,
    nextAction: nextActionFor("pending"),
  },
  {
    id: "assignment-2",
    reportId: "report-2",
    reportCode: "RPT-2026-2479",
    status: "pending",
    reportStatus: "assigned",
    urgency: "high",
    species: "cat",
    reportType: "stray",
    description: "Kitten stuck in a drainage canal",
    barangay: "Barangay Dahican",
    landmark: "Beside the barangay hall",
    latitude: 7.0481,
    longitude: 125.5892,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 3.8,
    assignedAt: minutesAgo(32),
    completedAt: null,
    nextAction: nextActionFor("pending"),
  },
  {
    id: "assignment-3",
    reportId: "report-3",
    reportCode: "RPT-2026-2475",
    status: "en_route",
    reportStatus: "in_progress",
    urgency: "high",
    species: "dog",
    reportType: "injured",
    description: "Hit by a motorcycle, conscious and breathing",
    barangay: "Barangay Central",
    landmark: "National highway, km 4 marker",
    latitude: 7.0644,
    longitude: 125.6077,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 1.1,
    assignedAt: minutesAgo(46),
    completedAt: null,
    nextAction: nextActionFor("en_route"),
  },
  {
    id: "assignment-4",
    reportId: "report-4",
    reportCode: "RPT-2026-2470",
    status: "on_site",
    reportStatus: "in_progress",
    urgency: "critical",
    species: "dog",
    reportType: "abandoned",
    description: "Mother dog and three pups under a closed store",
    barangay: "Barangay San Isidro",
    landmark: "Corner of Mabini and Rizal streets",
    latitude: 7.0699,
    longitude: 125.6085,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 0.4,
    assignedAt: minutesAgo(74),
    completedAt: null,
    nextAction: nextActionFor("on_site"),
  },
  {
    id: "assignment-5",
    reportId: "report-5",
    reportCode: "RPT-2026-2462",
    status: "completed",
    reportStatus: "rescued",
    urgency: "medium",
    species: "cat",
    reportType: "stray",
    description: "Malnourished cat near the market",
    barangay: "Barangay Poblacion",
    landmark: "Public market, east entrance",
    latitude: 7.0631,
    longitude: 125.6088,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 1.9,
    assignedAt: earlierToday(4),
    completedAt: earlierToday(2),
    nextAction: null,
  },
  {
    id: "assignment-6",
    reportId: "report-6",
    reportCode: "RPT-2026-2455",
    status: "completed",
    reportStatus: "rescued",
    urgency: "high",
    species: "dog",
    reportType: "injured",
    description: "Dog with a wounded front leg",
    barangay: "Barangay Dahican",
    landmark: "Near the elementary school",
    latitude: 7.0438,
    longitude: 125.5851,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 3.2,
    assignedAt: earlierToday(7),
    completedAt: earlierToday(5),
    nextAction: null,
  },
  {
    id: "assignment-7",
    reportId: "report-7",
    reportCode: "RPT-2026-2389",
    status: "completed",
    reportStatus: "rescued",
    urgency: "medium",
    species: "dog",
    reportType: "stray",
    description: "Litter of four pups behind the barangay gym",
    barangay: "Barangay Central",
    landmark: "Behind the covered gym",
    latitude: 7.0722,
    longitude: 125.6114,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 2.2,
    assignedAt: monthsAgo(1),
    completedAt: monthsAgo(1),
    nextAction: null,
  },
  {
    id: "assignment-8",
    reportId: "report-8",
    reportCode: "RPT-2026-2371",
    status: "failed",
    reportStatus: "unable_to_locate",
    urgency: "high",
    species: "cat",
    reportType: "injured",
    description: "Injured cat under a parked jeepney",
    barangay: "Barangay Dahican",
    landmark: "Terminal parking area",
    latitude: 7.0412,
    longitude: 125.5901,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 3.6,
    assignedAt: monthsAgo(1),
    completedAt: monthsAgo(1),
    nextAction: null,
  },
  {
    id: "assignment-9",
    reportId: "report-9",
    reportCode: "RPT-2026-2468",
    status: "accepted",
    reportStatus: "in_progress",
    urgency: "medium",
    species: "cat",
    reportType: "injured",
    description: "Cat with a leg wound hiding under a tricycle",
    barangay: "Barangay Poblacion",
    landmark: "Public market, north gate",
    latitude: 7.0624,
    longitude: 125.6102,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 1.5,
    assignedAt: minutesAgo(55),
    completedAt: null,
    nextAction: nextActionFor("accepted"),
  },
  {
    id: "assignment-10",
    reportId: "report-10",
    reportCode: "RPT-2026-2461",
    status: "declined",
    reportStatus: "verified",
    urgency: "low",
    species: "dog",
    reportType: "stray",
    description: "Dog wandering near the plaza fountain",
    barangay: "Barangay Central",
    landmark: "City plaza, near the fountain",
    latitude: 7.0701,
    longitude: 125.6089,
    photoUrl: null,
    reporter: "Anonymous",
    assignedBy: null,
    reporterUserId: null,
    assignedByUserId: null,
    distanceKm: 2.7,
    assignedAt: minutesAgo(135),
    completedAt: null,
    nextAction: null,
  },
];

/** Verified, unassigned reports. Read-only for rescuers in v1. */
const QUEUE: QueuedReport[] = [
  {
    id: "queue-1",
    reportCode: "RPT-2026-2492",
    reportStatus: "verified",
    reportType: "injured",
    species: "dog",
    urgency: "critical",
    description: "Dog collapsed near the public market, unable to stand",
    barangay: "Barangay Poblacion",
    landmark: "East entrance, beside the fish stalls",
    distanceKm: 1.7,
    submittedAt: minutesAgo(25),
    verifiedAt: minutesAgo(12),
  },
  {
    id: "queue-2",
    reportCode: "RPT-2026-2490",
    reportStatus: "verified",
    reportType: "stray",
    species: "cat",
    urgency: "medium",
    description: "Three kittens in an abandoned lot",
    barangay: "Barangay San Isidro",
    landmark: "Vacant lot across the chapel",
    distanceKm: 2.9,
    submittedAt: minutesAgo(58),
    verifiedAt: minutesAgo(30),
  },
  {
    id: "queue-3",
    reportCode: "RPT-2026-2486",
    reportStatus: "verified",
    reportType: "abandoned",
    species: "dog",
    urgency: "high",
    description: "Dog tied to a post with no water",
    barangay: "Barangay Central",
    landmark: "Near the elementary school gate",
    distanceKm: 1.2,
    submittedAt: minutesAgo(96),
    verifiedAt: minutesAgo(64),
  },
  {
    id: "queue-4",
    reportCode: "RPT-2026-2480",
    reportStatus: "verified",
    reportType: "stray",
    species: "unknown",
    urgency: "low",
    description: "Small animal heard crying inside a drainage pipe",
    barangay: "Barangay Dahican",
    landmark: "Corner of Mabini street",
    distanceKm: 4.1,
    submittedAt: minutesAgo(140),
    verifiedAt: minutesAgo(110),
  },
];

export function listAssignments(): RescuerAssignment[] {
  return assignments;
}

export function listQueuedReports(): QueuedReport[] {
  return QUEUE;
}

export function findAssignment(id: string): RescuerAssignment | null {
  return assignments.find((assignment) => assignment.id === id) ?? null;
}

/** Applies a field action and persists it in the placeholder store. */
export function commitTransition(
  id: string,
  transition: AssignmentTransition,
): RescuerAssignment {
  const current = findAssignment(id);
  if (!current) {
    throw new Error("Assignment not found.");
  }

  const updated = applyAssignmentTransition(current, transition);
  assignments = assignments.map((assignment) =>
    assignment.id === id ? updated : assignment,
  );
  return updated;
}
