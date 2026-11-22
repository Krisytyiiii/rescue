export type AdoptionStatus =
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "completed";

export type HousingType = "house" | "apartment" | "boarding" | "other";

export type FollowupMethod = "in_app" | "phone" | "visit";

export interface AdoptionFollowupRow {
  id: string;
  followupDate: string;
  method: FollowupMethod | null;
  animalCondition: string | null;
  remarks: string | null;
}

export interface AdoptionAnimalRow {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  primaryPhotoUrl: string | null;
  lifecycleStatus: string;
}

export interface AdoptionRow {
  id: string;
  requestCode: string;
  status: AdoptionStatus;
  createdAt: string;
  animal: AdoptionAnimalRow;
  adopter: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profilePhotoUrl: string | null;
  };
  reviewer: { id: string; name: string } | null;
  reviewedAt: string | null;
  decisionRemarks: string | null;
  interviewSchedule: string | null;
  releaseDate: string | null;
  housingType: HousingType;
  isOwnedProperty: boolean | null;
  hasFencedArea: boolean | null;
  householdMembers: number | null;
  hasOtherPets: boolean | null;
  otherPetsDetails: string | null;
  priorPetExperience: string | null;
  reasonForAdopting: string;
  validIdUrl: string;
  homePhotoUrl: string | null;
  receiptReferenceNo: string | null;
  followups: AdoptionFollowupRow[];
}

export interface AdoptionAnimalListRow {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  breedType: string;
  sex: string;
  estimatedAgeMonths: number | null;
  weightKg: string | null;
  size: string | null;
  colorMarkings: string | null;
  temperament: string | null;
  description: string | null;
  isNeutered: boolean;
  microchipNo: string | null;
  originType: string;
  intakeDate: string | null;
  primaryPhotoUrl: string | null;
  lifecycleStatus: string;
  listingStatus: string;
  adoptedDate: string | null;
  health: {
    records: number;
    vaccinations: number;
    hasHeartRate: boolean;
    ready: boolean;
  };
  openApplications: number;
}

export type AdoptionActionKind =
  | "review"
  | "interview"
  | "approve"
  | "reject"
  | "complete"
  | "followup";
