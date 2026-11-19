import type { BadgeTone } from "@/components/ui/badge";

export type AnimalSpecies = "dog" | "cat";
export type LifecycleStatus =
  | "reported"
  | "rescued"
  | "under_care"
  | "available"
  | "adoption_pending"
  | "adopted"
  | "returned_to_owner"
  | "deceased";
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";
export type OriginType =
  | "rescue_report"
  | "community_post"
  | "surrender"
  | "born_in_care";

export interface AnimalMediaRow {
  id: string;
  mediaType: "photo" | "video";
  fileUrl: string;
  caption: string | null;
  sortOrder: number | null;
}

export interface AnimalHealthRecordRow {
  id: string;
  recordType: string;
  recordDate: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  weightKg: string | null;
  followUpDate: string | null;
  remarks: string | null;
  attendedUser: { id: string; firstName: string; lastName: string } | null;
}

export interface AnimalVaccinationRow {
  id: string;
  vaccineName: string;
  doseNumber: number | null;
  dateGiven: string;
  nextDueDate: string | null;
  batchLotNo: string | null;
  status: "completed" | "due" | "overdue" | null;
}

/** Values from the intake form, used to render a card before the save lands. */
export interface AnimalDraft {
  name?: string;
  species: AnimalSpecies;
  breedType: string;
  sex: string;
  estimatedAgeMonths?: number;
  size?: string;
  colorMarkings?: string;
  temperament?: string;
  weightKg?: number;
  isNeutered: boolean;
  microchipNo?: string;
  originType: OriginType;
  intakeDate?: string;
  description?: string;
  photoUrl?: string;
}

export interface AnimalRow {
  id: string;
  animalCode: string;
  name: string | null;
  species: AnimalSpecies;
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  size: string | null;
  colorMarkings: string | null;
  temperament: string | null;
  weightKg: string | null;
  isNeutered: boolean;
  microchipNo: string | null;
  originType: OriginType;
  lifecycleStatus: LifecycleStatus;
  listingStatus: ListingStatus;
  intakeDate: string | null;
  adoptedDate: string | null;
  primaryPhotoUrl: string | null;
  model3dUrl: string | null;
  description: string | null;
  sourceReport: { id: string; reportCode: string; status: string } | null;
  postedBy: { id: string; firstName: string; lastName: string } | null;
  media: AnimalMediaRow[];
  healthRecords: AnimalHealthRecordRow[];
  vaccinations: AnimalVaccinationRow[];
  hasHeartRate: boolean;
  createdAt: string;
  updatedAt: string;
  /** True while an optimistic newly added animal waits for the server. */
  pending?: boolean;
}

export interface AnimalHealthData {
  records: Array<{
    id: string;
    recordType: string;
    recordDate: string;
    diagnosis: string | null;
    treatment: string | null;
    medication: string | null;
    weightKg: string | null;
    followUpDate: string | null;
    remarks: string | null;
  }>;
  vaccinations: Array<{
    id: string;
    vaccineName: string;
    doseNumber: number | null;
    dateGiven: string;
    nextDueDate: string | null;
    batchLotNo: string | null;
    status: "completed" | "due" | "overdue" | null;
  }>;
  heartRates: Array<{
    id: string;
    heartRateBpm: number;
    measurementContext: string | null;
    measuredAt: string;
    isFlagged: boolean;
    notes: string | null;
  }>;
}

export interface AnimalCounts {
  total: number;
  inCare: number;
  available: number;
  adoptionPending: number;
  adopted: number;
  pendingReview: number;
}

export const LIFECYCLE_META: Record<
  LifecycleStatus,
  { label: string; tone: BadgeTone; pin: string }
> = {
  reported: { label: "Reported sighting", tone: "pending", pin: "#c99a4e" },
  rescued: { label: "Rescued", tone: "info", pin: "#2563eb" },
  under_care: { label: "At the city vet", tone: "progress", pin: "#0d9488" },
  available: { label: "Ready for adoption", tone: "success", pin: "#15803d" },
  adoption_pending: { label: "Adoption in progress", tone: "pending", pin: "#b45309" },
  adopted: { label: "Adopted", tone: "success", pin: "#166534" },
  returned_to_owner: { label: "Returned to owner", tone: "neutral", pin: "#64748b" },
  deceased: { label: "Deceased", tone: "neutral", pin: "#475569" },
};

/** Short, plain-language names for the "move to" actions. */
export const MOVE_LABELS: Record<LifecycleStatus, string> = {
  reported: "Reported sighting",
  rescued: "Rescued",
  under_care: "City vet care",
  available: "Ready for adoption",
  adoption_pending: "Adoption in progress",
  adopted: "Adopted",
  returned_to_owner: "Returned to owner",
  deceased: "Deceased",
};

export const LISTING_META: Record<ListingStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Not published", tone: "neutral" },
  pending_review: { label: "Waiting for approval", tone: "warning" },
  published: { label: "Live for adoption", tone: "success" },
  rejected: { label: "Not approved", tone: "danger" },
  archived: { label: "No longer listed", tone: "neutral" },
};

export const ORIGIN_LABELS: Record<OriginType, string> = {
  rescue_report: "From a rescue report",
  community_post: "Posted by the community",
  surrender: "Given up by an owner",
  born_in_care: "Born while in care",
};

/** Mirror of the core transition map so the UI only offers legal moves. */
export const LIFECYCLE_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  reported: ["rescued", "under_care", "returned_to_owner", "deceased"],
  rescued: ["under_care", "returned_to_owner", "deceased"],
  under_care: ["available", "adoption_pending", "returned_to_owner", "deceased"],
  available: ["adoption_pending", "under_care", "deceased"],
  adoption_pending: ["adopted", "available", "under_care"],
  adopted: [],
  returned_to_owner: [],
  deceased: [],
};

export const HEALTH_RECORD_TYPES = [
  "checkup",
  "illness",
  "injury",
  "treatment",
  "surgery",
  "deworming",
  "spay_neuter",
  "other",
] as const;

export const HEART_RATE_RANGES: Record<AnimalSpecies, { min: number; max: number }> = {
  dog: { min: 60, max: 140 },
  cat: { min: 140, max: 220 },
};
