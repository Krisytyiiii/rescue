/**
 * Read-only animal records shared by the rescuer mobile app.
 *
 * Mirrors the Prisma enums and the serialized `GET /api/animals` payload.
 * The Animals screen never writes: care records are owned by the admin
 * console and the City Vet.
 */

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

export type HealthRecordType =
  | "checkup"
  | "illness"
  | "injury"
  | "treatment"
  | "surgery"
  | "deworming"
  | "spay_neuter"
  | "other";

export interface AnimalMedia {
  id: string;
  mediaType: "photo" | "video";
  fileUrl: string;
  caption: string | null;
  sortOrder: number | null;
}

export interface AnimalHealthRecord {
  id: string;
  recordType: HealthRecordType;
  recordDate: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  weightKg: string | null;
  followUpDate: string | null;
  remarks: string | null;
}

export interface AnimalVaccination {
  id: string;
  vaccineName: string;
  doseNumber: number | null;
  dateGiven: string;
  nextDueDate: string | null;
  batchLotNo: string | null;
  status: "completed" | "due" | "overdue" | null;
}

export interface AnimalHeartRate {
  id: string;
  heartRateBpm: number;
  measurementContext: string | null;
  measuredAt: string;
  isFlagged: boolean;
  notes: string | null;
}

/** One entry in the rescue report's status timeline. */
export interface AnimalHistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  remarks: string | null;
  changedAt: string;
}

export interface Animal {
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
  description: string | null;
  createdAt: string;
  media: AnimalMedia[];
  healthRecords: AnimalHealthRecord[];
  vaccinations: AnimalVaccination[];
  heartRateLogs: AnimalHeartRate[];
  sourceReport: {
    id: string;
    reportCode: string;
    status: string;
    statusHistory: AnimalHistoryEntry[];
  } | null;
}

export interface AnimalsPage {
  items: Animal[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
