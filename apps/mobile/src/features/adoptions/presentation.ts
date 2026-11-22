import type {
  AdoptionAnimal,
  AdoptionRequest,
  AdoptionStatus,
  FollowupMethod,
  HousingType,
} from "@/domain/adoptions";

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

export const ADOPTION_STATUS_ORDER: AdoptionStatus[] = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "approved",
  "completed",
  "rejected",
  "withdrawn",
];

export const ADOPTION_STATUS_LABEL: Record<AdoptionStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  interview_scheduled: "Interview",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const ADOPTION_STATUS_TONE: Record<
  AdoptionStatus,
  { background: string; ink: string }
> = {
  submitted: { background: "rgba(96,124,255,0.16)", ink: "#3E50B4" },
  under_review: { background: "rgba(242,178,100,0.20)", ink: "#A46412" },
  interview_scheduled: { background: "rgba(96,124,255,0.16)", ink: "#3E50B4" },
  approved: { background: "rgba(22,96,59,0.16)", ink: "#16603B" },
  completed: { background: "rgba(22,96,59,0.20)", ink: "#16603B" },
  rejected: { background: "rgba(180,70,47,0.14)", ink: "#B4462F" },
  withdrawn: { background: "rgba(16,36,26,0.08)", ink: "#5F7A6B" },
};

export const HOUSING_LABEL: Record<HousingType, string> = {
  house: "House",
  apartment: "Apartment",
  boarding: "Boarding",
  other: "Other",
};

/** Fixed venue where adoption meet-and-greets are held. */
export const INTERVIEW_VENUE = "City Vet Building";

export const FOLLOWUP_METHOD_LABEL: Record<FollowupMethod, string> = {
  in_app: "In-app",
  phone: "Phone call",
  visit: "Home visit",
};

export function formatDate(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hour}:${minutes} ${suffix}`;
}

export function animalName(animal: AdoptionAnimal): string {
  return animal.name?.trim() || animal.animalCode;
}

export function animalPhoto(animal: AdoptionAnimal): string | null {
  return (
    animal.primaryPhotoUrl ?? animal.media[0]?.fileUrl ?? null
  );
}

export function personName(person: {
  firstName: string;
  lastName: string;
}): string {
  return [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Applicant";
}

export function yesNo(value: boolean | null): string {
  if (value === null) return "Not answered";
  return value ? "Yes" : "No";
}

export function isOpen(status: AdoptionStatus): boolean {
  return ["submitted", "under_review", "interview_scheduled"].includes(status);
}

export function adopterContact(request: AdoptionRequest): string {
  return request.adopter.phoneNumber
    ? `${request.adopter.email} · ${request.adopter.phoneNumber}`
    : request.adopter.email;
}
