import type { LifecycleStatus, ListingStatus } from "../animals/animals-types";

export type HealthRecordType =
  | "checkup"
  | "illness"
  | "injury"
  | "treatment"
  | "surgery"
  | "deworming"
  | "spay_neuter"
  | "other";

export type VaccinationStatus = "completed" | "due" | "overdue";

export interface HealthAnimalRow {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  weightKg: string | null;
  lifecycleStatus: LifecycleStatus;
  listingStatus: ListingStatus;
  primaryPhotoUrl: string | null;
}

export interface HealthHeartReading {
  id: string;
  heartRateBpm: number;
  measuredAt: string;
  isFlagged: boolean;
}

export interface HealthRecordRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  recordType: HealthRecordType;
  recordDate: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  weightKg: string | null;
  followUpDate: string | null;
  remarks: string | null;
  attendedBy: { id: string; name: string } | null;
  heartRates: HealthHeartReading[];
}

export interface HealthVaccinationRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  vaccineName: string;
  doseNumber: number | null;
  dateGiven: string;
  nextDueDate: string | null;
  batchLotNo: string | null;
  status: VaccinationStatus | null;
  administeredBy: { id: string; name: string } | null;
}

export interface HealthHeartRateRow {
  id: string;
  animalId: string;
  animal: HealthAnimalRow;
  heartRateBpm: number;
  measurementContext: string | null;
  measuredAt: string;
  isFlagged: boolean;
  notes: string | null;
}

export type HealthTab = "watchlist" | "vaccinations" | "records" | "heart_rate";

export type WatchReason =
  | "overdue"
  | "due"
  | "follow_up"
  | "heart_flag"
  | "no_check";

export interface WatchItem {
  id: string;
  reason: WatchReason;
  animal: HealthAnimalRow;
  title: string;
  detail: string;
  date: string | null;
  /** Payload used to open the right add/edit dialog. */
  actionLabel: string;
  kind: "record" | "vaccination" | "heart_rate";
}
