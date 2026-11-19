import type { AdoptionDetail, AnimalDetail } from "@furescue/core";

import type { AdoptionAnimalListRow, AdoptionRow } from "./adoptions-types";

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function person(
  user: { id: string; firstName: string; lastName: string } | null,
): { id: string; name: string } | null {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return { id: user.id, name: name || "Staff" };
}

/** Maps a domain adoption request into the client row shape. */
export function toAdoptionRow(request: AdoptionDetail): AdoptionRow {
  return {
    id: request.id,
    requestCode: request.requestCode,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    animal: {
      id: request.animal.id,
      animalCode: request.animal.animalCode,
      name: request.animal.name,
      species: request.animal.species,
      primaryPhotoUrl:
        request.animal.primaryPhotoUrl ?? request.animal.media[0]?.fileUrl ?? null,
      lifecycleStatus: request.animal.lifecycleStatus,
    },
    adopter: {
      id: request.adopter.id,
      name:
        [request.adopter.firstName, request.adopter.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || "Applicant",
      email: request.adopter.email,
      phoneNumber: request.adopter.phoneNumber,
    },
    reviewer: person(request.reviewer),
    reviewedAt: iso(request.reviewedAt),
    decisionRemarks: request.decisionRemarks,
    interviewSchedule: iso(request.interviewSchedule),
    releaseDate: iso(request.releaseDate),
    housingType: request.housingType,
    isOwnedProperty: request.isOwnedProperty,
    hasFencedArea: request.hasFencedArea,
    householdMembers: request.householdMembers,
    hasOtherPets: request.hasOtherPets,
    otherPetsDetails: request.otherPetsDetails,
    priorPetExperience: request.priorPetExperience,
    reasonForAdopting: request.reasonForAdopting,
    validIdUrl: request.validIdUrl,
    homePhotoUrl: request.homePhotoUrl,
    receiptReferenceNo: request.receiptReferenceNo,
    followups: request.followups.map((followup) => ({
      id: followup.id,
      followupDate: followup.followupDate.toISOString(),
      method: followup.method,
      animalCondition: followup.animalCondition,
      remarks: followup.remarks,
    })),
  };
}

/** Maps an animal into the adoption-animals table row. */
export function toAdoptionAnimalRow(animal: AnimalDetail): AdoptionAnimalListRow {
  const records = animal.healthRecords.length;
  const vaccinations = animal.vaccinations.length;
  const hasHeartRate = animal.heartRateLogs.length > 0;

  return {
    id: animal.id,
    animalCode: animal.animalCode,
    name: animal.name,
    species: animal.species,
    breedType: animal.breedType,
    sex: animal.sex,
    estimatedAgeMonths: animal.estimatedAgeMonths,
    weightKg: animal.weightKg ? String(animal.weightKg) : null,
    size: animal.size ?? null,
    colorMarkings: animal.colorMarkings ?? null,
    temperament: animal.temperament ?? null,
    description: animal.description ?? null,
    isNeutered: animal.isNeutered,
    microchipNo: animal.microchipNo ?? null,
    originType: animal.originType,
    intakeDate: animal.intakeDate ? animal.intakeDate.toISOString() : null,
    primaryPhotoUrl:
      animal.primaryPhotoUrl ??
      animal.media.find((item) => item.mediaType === "photo")?.fileUrl ??
      null,
    lifecycleStatus: animal.lifecycleStatus,
    listingStatus: animal.listingStatus,
    adoptedDate: animal.adoptedDate ? animal.adoptedDate.toISOString() : null,
    health: {
      records,
      vaccinations,
      hasHeartRate,
      ready: records > 0 && vaccinations > 0 && hasHeartRate,
    },
    openApplications: 0,
  };
}
