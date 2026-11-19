import type { AnimalDetail } from "@furescue/core";

import type { AnimalRow } from "./animals-types";

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Maps a domain animal into the shape rendered by the animals console. */
export function toAnimalRow(animal: AnimalDetail): AnimalRow {
  return {
    id: animal.id,
    animalCode: animal.animalCode,
    name: animal.name,
    species: animal.species,
    breedType: animal.breedType,
    sex: animal.sex,
    estimatedAgeMonths: animal.estimatedAgeMonths,
    size: animal.size,
    colorMarkings: animal.colorMarkings,
    temperament: animal.temperament,
    weightKg: animal.weightKg ? String(animal.weightKg) : null,
    isNeutered: animal.isNeutered,
    microchipNo: animal.microchipNo,
    originType: animal.originType,
    lifecycleStatus: animal.lifecycleStatus,
    listingStatus: animal.listingStatus,
    intakeDate: iso(animal.intakeDate),
    adoptedDate: iso(animal.adoptedDate),
    primaryPhotoUrl: animal.primaryPhotoUrl,
    model3dUrl: animal.model3dUrl,
    description: animal.description,
    sourceReport: animal.sourceReport,
    postedBy: animal.postedBy,
    media: animal.media.map((item) => ({
      id: item.id,
      mediaType: item.mediaType,
      fileUrl: item.fileUrl,
      caption: item.caption,
      sortOrder: item.sortOrder,
    })),
    healthRecords: animal.healthRecords.map((record) => ({
      id: record.id,
      recordType: record.recordType,
      recordDate: record.recordDate.toISOString(),
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      medication: record.medication,
      weightKg: record.weightKg ? String(record.weightKg) : null,
      followUpDate: iso(record.followUpDate),
      remarks: record.remarks,
      attendedUser: null,
    })),
    vaccinations: animal.vaccinations.map((vaccination) => ({
      id: vaccination.id,
      vaccineName: vaccination.vaccineName,
      doseNumber: vaccination.doseNumber,
      dateGiven: vaccination.dateGiven.toISOString(),
      nextDueDate: iso(vaccination.nextDueDate),
      batchLotNo: vaccination.batchLotNo,
      status: vaccination.status,
    })),
    hasHeartRate: animal.heartRateLogs.length > 0,
    createdAt: animal.createdAt.toISOString(),
    updatedAt: animal.updatedAt.toISOString(),
  };
}
