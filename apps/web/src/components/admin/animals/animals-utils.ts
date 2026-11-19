import type { AnimalRow, LifecycleStatus } from "./animals-types";
import { LIFECYCLE_TRANSITIONS } from "./animals-types";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatAge(months: number | null): string {
  if (months === null) return "Unknown";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} yr ${rest} mo` : `${years} yr`;
}

export function formatWeight(kg: string | null): string {
  if (!kg) return "—";
  return `${Number(kg).toFixed(2)} kg`;
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function nextLifecycleStates(status: LifecycleStatus): LifecycleStatus[] {
  return LIFECYCLE_TRANSITIONS[status] ?? [];
}

export function isTerminal(status: LifecycleStatus): boolean {
  return LIFECYCLE_TRANSITIONS[status]?.length === 0;
}

/** Health requirements that must be met before an animal can be adopted out. */
export function adoptionReadiness(animal: AnimalRow): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (animal.healthRecords.length === 0) missing.push("a medical note");
  if (animal.vaccinations.length === 0) missing.push("a vaccination record");
  if (!animal.hasHeartRate) missing.push("a heart rate reading");
  return { ready: missing.length === 0, missing };
}

/** Sentence listing what is still missing, e.g. "a medical note and a heart rate reading". */
export function missingHealthText(missing: string[]): string {
  if (missing.length === 0) return "";
  if (missing.length === 1) return missing[0]!;
  return `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
}

/** The recommended next step in the rescue → care → adoption workflow. */
export function primaryWorkflow(animal: AnimalRow): string | null {
  if (animal.lifecycleStatus === "reported" || animal.lifecycleStatus === "rescued") {
    return "care";
  }
  if (animal.lifecycleStatus === "under_care") return "ready";
  if (animal.lifecycleStatus === "available" && animal.listingStatus !== "published") {
    return "publish";
  }
  if (animal.lifecycleStatus === "adoption_pending") return "adopt";
  return null;
}
