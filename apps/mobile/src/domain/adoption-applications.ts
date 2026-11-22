/**
 * Resident-facing adoption listing and application.
 *
 * Mirrors `GET /api/adoptions/available` and `POST /api/adoptions`. Staff
 * review of the application stays in the admin console.
 */

export type AdoptionHousingType = "house" | "apartment" | "boarding" | "other";

export type ListingApplicationStatus =
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "approved";

/** The caller's own open application for one listed animal. */
export interface OpenAdoptionApplication {
  id: string;
  requestCode: string;
  status: ListingApplicationStatus;
}

/** One animal currently open for adoption. */
export interface AdoptableAnimal {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  size: string | null;
  colorMarkings: string | null;
  temperament: string | null;
  description: string | null;
  primaryPhotoUrl: string | null;
  intakeDate: string | null;
  createdAt: string;
  lifecycleStatus: string;
  listingStatus: string;
  media: Array<{ fileUrl: string }>;
  application: OpenAdoptionApplication | null;
}

/** What a resident submits to apply for one listed animal. */
export interface AdoptionApplicationInput {
  animalId: string;
  housingType: AdoptionHousingType;
  isOwnedProperty?: boolean;
  hasFencedArea?: boolean;
  householdMembers?: number;
  hasOtherPets?: boolean;
  otherPetsDetails?: string;
  priorPetExperience?: string;
  reasonForAdopting: string;
  validIdUrl: string;
  homePhotoUrl?: string;
}

export interface CreatedAdoptionApplication {
  id: string;
  requestCode: string;
  status: string;
}

/** Form state for the resident application sheet. */
export interface AdoptionDraft {
  housingType: AdoptionHousingType;
  isOwnedProperty: boolean;
  hasFencedArea: boolean;
  householdMembers: string;
  hasOtherPets: boolean;
  otherPetsDetails: string;
  priorPetExperience: string;
  reasonForAdopting: string;
  validIdUrl: string | null;
  homePhotoUrl: string | null;
}

/** Checks the resident's answers before anything is uploaded or sent. */
export function adoptionDraftError(draft: AdoptionDraft): string | null {
  if (!draft.validIdUrl) {
    return "Attach a photo of a valid ID so the team can verify you.";
  }

  const reason = draft.reasonForAdopting.trim();
  if (reason.length < 20) {
    return "Tell the team a little more about why you want to adopt (at least 20 characters).";
  }

  const members = draft.householdMembers.trim();
  if (members) {
    const count = Number(members);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return "Household members must be a whole number between 1 and 50.";
    }
  }

  if (draft.hasOtherPets && draft.otherPetsDetails.trim().length > 255) {
    return "Keep the other pets note under 255 characters.";
  }

  return null;
}

/** Turns validated form state into the API payload. */
export function adoptionDraftToInput(
  animalId: string,
  draft: AdoptionDraft,
): AdoptionApplicationInput {
  const members = draft.householdMembers.trim();

  return {
    animalId,
    housingType: draft.housingType,
    isOwnedProperty: draft.isOwnedProperty,
    hasFencedArea: draft.hasFencedArea,
    householdMembers: members ? Number(members) : undefined,
    hasOtherPets: draft.hasOtherPets,
    otherPetsDetails: draft.hasOtherPets
      ? draft.otherPetsDetails.trim() || undefined
      : undefined,
    priorPetExperience: draft.priorPetExperience.trim() || undefined,
    reasonForAdopting: draft.reasonForAdopting.trim(),
    validIdUrl: draft.validIdUrl ?? "",
    homePhotoUrl: draft.homePhotoUrl ?? undefined,
  };
}

/** A local image selected on the device, before it is uploaded. */
export interface AdoptionIdUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}
