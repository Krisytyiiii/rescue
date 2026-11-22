import type {
  Animal,
  HealthRecordType,
  LifecycleStatus,
  OriginType,
} from "@/domain/animals";

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

export const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  reported: "Reported",
  rescued: "Rescued",
  under_care: "At the city vet",
  available: "Ready for adoption",
  adoption_pending: "Adoption in progress",
  adopted: "Adopted",
  returned_to_owner: "Returned to owner",
  deceased: "Deceased",
};

export const LIFECYCLE_TONE: Record<
  LifecycleStatus,
  { background: string; ink: string }
> = {
  reported: { background: "rgba(242,178,100,0.20)", ink: "#A46412" },
  rescued: { background: "rgba(31,122,77,0.18)", ink: "#1F7A4D" },
  under_care: { background: "rgba(47,143,99,0.18)", ink: "#2F7F5B" },
  available: { background: "rgba(31,122,77,0.20)", ink: "#16603B" },
  adoption_pending: { background: "rgba(180,83,9,0.18)", ink: "#9A4A0D" },
  adopted: { background: "rgba(22,96,59,0.20)", ink: "#16603B" },
  returned_to_owner: { background: "rgba(16,36,26,0.09)", ink: "#5F7A6B" },
  deceased: { background: "rgba(16,36,26,0.09)", ink: "#3F5749" },
};

export const ORIGIN_LABEL: Record<OriginType, string> = {
  rescue_report: "From a rescue report",
  community_post: "Posted by the community",
  surrender: "Given up by an owner",
  born_in_care: "Born while in care",
};

export const HEALTH_RECORD_LABEL: Record<HealthRecordType, string> = {
  checkup: "Check-up",
  illness: "Illness",
  injury: "Injury",
  treatment: "Treatment",
  surgery: "Surgery",
  deworming: "Deworming",
  spay_neuter: "Spay / neuter",
  other: "Other",
};

export const SPECIES_LABEL: Record<Animal["species"], string> = {
  dog: "Dog",
  cat: "Cat",
};

export function animalName(animal: Animal): string {
  return animal.name?.trim() || "Unnamed";
}

export function photoUrl(animal: Animal): string | null {
  if (animal.primaryPhotoUrl) return animal.primaryPhotoUrl;
  const photo = animal.media.find((item) => item.mediaType === "photo");
  return photo?.fileUrl ?? null;
}

export function ageLabel(months: number | null): string {
  if (months === null || months < 0) return "Age unknown";
  if (months < 1) return "Newborn";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} ${years === 1 ? "yr" : "yrs"}`;
  return `${years} yr ${rest} mo`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatMonthDay(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function weightLabel(value: string | null): string {
  if (!value) return "Not recorded";
  return `${value} kg`;
}

export function sexLabel(value: string): string {
  return value === "unknown" ? "Unknown sex" : capitalize(value);
}
