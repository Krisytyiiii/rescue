import type {
  HealthAnimalSummary,
  HealthRecordWithAnimal,
  HeartRateWithAnimal,
  VaccinationWithAnimal,
} from "@furescue/core";

import type {
  HealthAnimalRow,
  HealthHeartRateRow,
  HealthRecordRow,
  HealthVaccinationRow,
  VaccinationStatus,
} from "./health-types";

const DUE_WINDOW_DAYS = 7;

export function healthAnimalName(animal: HealthAnimalRow): string {
  return animal.name?.trim() || animal.animalCode;
}

export function toHealthAnimal(animal: HealthAnimalSummary): HealthAnimalRow {
  return {
    id: animal.id,
    animalCode: animal.animalCode,
    name: animal.name,
    species: animal.species,
    breedType: animal.breedType,
    sex: animal.sex,
    estimatedAgeMonths: animal.estimatedAgeMonths,
    weightKg: animal.weightKg ? String(animal.weightKg) : null,
    lifecycleStatus: animal.lifecycleStatus,
    listingStatus: animal.listingStatus,
    primaryPhotoUrl: animal.primaryPhotoUrl ?? animal.media[0]?.fileUrl ?? null,
  };
}

function person(
  user: { id: string; firstName: string; lastName: string } | null,
): { id: string; name: string } | null {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return { id: user.id, name: name || "Staff" };
}

export function toHealthRecord(record: HealthRecordWithAnimal): HealthRecordRow {
  return {
    id: record.id,
    animalId: record.animalId,
    animal: toHealthAnimal(record.animal),
    recordType: record.recordType,
    recordDate: record.recordDate.toISOString(),
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    medication: record.medication,
    weightKg: record.weightKg ? String(record.weightKg) : null,
    followUpDate: record.followUpDate ? record.followUpDate.toISOString() : null,
    remarks: record.remarks,
    attendedBy: person(record.attendedUser),
    heartRates: record.heartRates.map((reading) => ({
      id: reading.id,
      heartRateBpm: reading.heartRateBpm,
      measuredAt: reading.measuredAt.toISOString(),
      isFlagged: reading.isFlagged,
    })),
  };
}

/** Recomputes status from the due date so tables never show stale values. */
export function vaccinationStatusFor(
  nextDueDate: string | null,
  now = new Date(),
): VaccinationStatus {
  if (!nextDueDate) return "completed";
  const due = new Date(nextDueDate);
  if (due.getTime() < now.getTime()) return "overdue";
  const horizon = new Date(now.getTime() + DUE_WINDOW_DAYS * 86_400_000);
  return due.getTime() <= horizon.getTime() ? "due" : "completed";
}

export function toHealthVaccination(
  vaccination: VaccinationWithAnimal,
): HealthVaccinationRow {
  const nextDueDate = vaccination.nextDueDate
    ? vaccination.nextDueDate.toISOString()
    : null;
  return {
    id: vaccination.id,
    animalId: vaccination.animalId,
    animal: toHealthAnimal(vaccination.animal),
    vaccineName: vaccination.vaccineName,
    doseNumber: vaccination.doseNumber,
    dateGiven: vaccination.dateGiven.toISOString(),
    nextDueDate,
    batchLotNo: vaccination.batchLotNo,
    status: vaccinationStatusFor(nextDueDate),
    administeredBy: person(vaccination.administered),
  };
}

export function toHealthHeartRate(
  reading: HeartRateWithAnimal,
): HealthHeartRateRow {
  return {
    id: reading.id,
    animalId: reading.animalId,
    animal: toHealthAnimal(reading.animal),
    heartRateBpm: reading.heartRateBpm,
    measurementContext: reading.measurementContext,
    measuredAt: reading.measuredAt.toISOString(),
    isFlagged: reading.isFlagged,
    notes: reading.notes,
  };
}
