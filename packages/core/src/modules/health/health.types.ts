import type { Prisma } from "../../generated/prisma/client.ts";
import type { Species } from "../../generated/prisma/enums.ts";

/** Rough resting ranges — vet-confirmed thresholds should override these. */
export const HEART_RATE_RANGES: Record<Species, { min: number; max: number }> = {
  dog: { min: 60, max: 140 },
  cat: { min: 140, max: 220 },
};

export const VACCINATION_DUE_WINDOW_DAYS = 7;

export const healthRecordInclude = {
  attendedUser: { select: { id: true, firstName: true, lastName: true } },
  heartRates: { orderBy: { measuredAt: "desc" } },
} satisfies Prisma.HealthRecordInclude;

export type HealthRecordDetail = Prisma.HealthRecordGetPayload<{
  include: typeof healthRecordInclude;
}>;

export interface CreateHealthRecordInput {
  animalId: string;
  recordType:
    | "checkup"
    | "illness"
    | "injury"
    | "treatment"
    | "surgery"
    | "deworming"
    | "spay_neuter"
    | "other";
  recordDate: Date;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  weightKg?: number;
  followUpDate?: Date;
  remarks?: string;
}

export interface CreateVaccinationInput {
  animalId: string;
  vaccineName: string;
  doseNumber?: number;
  dateGiven: Date;
  nextDueDate?: Date;
  batchLotNo?: string;
}

export interface CreateHeartRateInput {
  animalId: string;
  healthRecordId?: string;
  heartRateBpm: number;
  measurementContext?: "resting" | "post_activity" | "under_stress" | "during_exam";
  measuredAt?: Date;
  notes?: string;
}

export type UpdateHealthRecordInput = Omit<CreateHealthRecordInput, "animalId">;
export type UpdateVaccinationInput = Omit<CreateVaccinationInput, "animalId">;
export type UpdateHeartRateInput = Omit<CreateHeartRateInput, "animalId">;

/** Compact animal summary included on cross-animal health lists. */
export const healthAnimalSelect = {
  id: true,
  animalCode: true,
  name: true,
  species: true,
  breedType: true,
  sex: true,
  estimatedAgeMonths: true,
  weightKg: true,
  lifecycleStatus: true,
  listingStatus: true,
  primaryPhotoUrl: true,
  media: {
    where: { mediaType: "photo" },
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { fileUrl: true },
  },
} satisfies Prisma.AnimalSelect;

export type HealthAnimalSummary = Prisma.AnimalGetPayload<{
  select: typeof healthAnimalSelect;
}>;

export const healthRecordListInclude = {
  animal: { select: healthAnimalSelect },
  attendedUser: { select: { id: true, firstName: true, lastName: true } },
  heartRates: { orderBy: { measuredAt: "desc" } },
} satisfies Prisma.HealthRecordInclude;

export type HealthRecordWithAnimal = Prisma.HealthRecordGetPayload<{
  include: typeof healthRecordListInclude;
}>;

export const vaccinationListInclude = {
  animal: { select: healthAnimalSelect },
  administered: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.VaccinationInclude;

export type VaccinationWithAnimal = Prisma.VaccinationGetPayload<{
  include: typeof vaccinationListInclude;
}>;

export const heartRateListInclude = {
  animal: { select: healthAnimalSelect },
} satisfies Prisma.HeartRateLogInclude;

export type HeartRateWithAnimal = Prisma.HeartRateLogGetPayload<{
  include: typeof heartRateListInclude;
}>;
