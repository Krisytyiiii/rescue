/**
 * Read-only adoption records shared by the rescuer mobile app.
 *
 * Mirrors the serialized `GET /api/adoptions` payload. The screen is
 * informational: reviewing, approving, and completing adoptions stays in the
 * admin console.
 */

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

export interface AdoptionAnimal {
  id: string;
  animalCode: string;
  name: string | null;
  species: "dog" | "cat";
  primaryPhotoUrl: string | null;
  lifecycleStatus: string;
  media: Array<{ fileUrl: string }>;
}

export interface AdoptionAdopter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export interface AdoptionReviewer {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AdoptionFollowup {
  id: string;
  followupDate: string;
  method: FollowupMethod | null;
  animalCondition: string | null;
  remarks: string | null;
}

export interface AdoptionRequest {
  id: string;
  requestCode: string;
  status: AdoptionStatus;
  createdAt: string;
  animal: AdoptionAnimal;
  adopter: AdoptionAdopter;
  reviewer: AdoptionReviewer | null;
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
  homePhotoUrl: string | null;
  receiptReferenceNo: string | null;
  followups: AdoptionFollowup[];
}

export interface AdoptionsPage {
  items: AdoptionRequest[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
