import type { BadgeTone } from "@/components/ui/badge";

import type {
  AdoptionActionKind,
  AdoptionStatus,
  FollowupMethod,
  HousingType,
} from "./adoptions-types";

/** Fixed venue where adoption meet-and-greets are held. Kept client-safe here. */
export const INTERVIEW_VENUE = "City Vet Building";

export const STATUS_META: Record<AdoptionStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "warning" },
  interview_scheduled: { label: "Interview", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

export const HOUSING_LABELS: Record<HousingType, string> = {
  house: "House",
  apartment: "Apartment",
  boarding: "Boarding",
  other: "Other",
};

export const METHOD_LABELS: Record<FollowupMethod, string> = {
  in_app: "In-app",
  phone: "Phone call",
  visit: "Home visit",
};

export const ACTION_LABELS: Record<AdoptionActionKind, string> = {
  review: "Start review",
  interview: "Schedule interview",
  approve: "Approve applicant",
  reject: "Reject",
  complete: "Complete adoption",
  followup: "Add follow-up",
};

/** Action wording that adapts to the current status (e.g. rescheduling). */
export function actionLabelFor(
  kind: AdoptionActionKind,
  status: AdoptionStatus,
): string {
  if (kind === "interview" && status === "interview_scheduled") {
    return "Reschedule interview";
  }
  return ACTION_LABELS[kind];
}

/** An interview counts as held only once its scheduled time has passed. */
export function interviewHasHappened(schedule: string | null, now: number): boolean {
  return Boolean(schedule) && new Date(schedule as string).getTime() <= now;
}

/** Next steps available for a request, in the order they should appear. */
export function actionsFor(
  status: AdoptionStatus,
  interview?: { schedule: string | null; now: number },
): AdoptionActionKind[] {
  switch (status) {
    case "submitted":
      return ["review", "reject"];
    case "under_review":
      return ["interview", "reject"];
    case "interview_scheduled":
      return interview && interviewHasHappened(interview.schedule, interview.now)
        ? ["approve", "reject"]
        : ["interview", "reject"];
    case "approved":
      return ["complete", "followup"];
    case "completed":
      return ["followup"];
    default:
      return [];
  }
}

/** The single primary action shown in the table's action column. */
export function primaryActionFor(
  status: AdoptionStatus,
  interview?: { schedule: string | null; now: number },
): AdoptionActionKind | null {
  switch (status) {
    case "submitted":
      return "review";
    case "under_review":
      return "interview";
    case "interview_scheduled":
      return interview && interviewHasHappened(interview.schedule, interview.now)
        ? "approve"
        : "interview";
    case "approved":
      return "complete";
    case "completed":
      return "followup";
    default:
      return null;
  }
}
