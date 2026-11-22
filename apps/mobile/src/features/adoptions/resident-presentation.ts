import type {
  AdoptableAnimal,
  OpenAdoptionApplication,
} from "@/domain/adoption-applications";

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

export const HOUSING_TYPE_LABEL = {
  house: "House",
  apartment: "Apartment",
  boarding: "Boarding",
  other: "Other",
} as const;

export const APPLICATION_STATUS_LABEL: Record<
  OpenAdoptionApplication["status"],
  string
> = {
  submitted: "Submitted",
  under_review: "Under review",
  interview_scheduled: "Interview scheduled",
  approved: "Approved",
};

export function adoptableName(animal: AdoptableAnimal): string {
  return animal.name?.trim() || "Unnamed";
}

export function adoptablePhoto(animal: AdoptableAnimal): string | null {
  if (animal.primaryPhotoUrl) return animal.primaryPhotoUrl;
  return animal.media[0]?.fileUrl ?? null;
}

export function adoptableAge(months: number | null): string {
  if (months === null || months < 0) return "Age unknown";
  if (months < 1) return "Newborn";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} ${years === 1 ? "yr" : "yrs"}`;
  return `${years} yr ${rest} mo`;
}

export function adoptionDate(iso: string | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function speciesLabel(species: AdoptableAnimal["species"]): string {
  return species === "dog" ? "Dog" : "Cat";
}

export function sexLabel(sex: string): string {
  if (sex === "unknown") return "Sex unknown";
  return sex.charAt(0).toUpperCase() + sex.slice(1);
}
