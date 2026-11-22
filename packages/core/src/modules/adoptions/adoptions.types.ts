import type { Prisma } from "../../generated/prisma/client.ts";
import type { AdoptionStatus, HousingType } from "../../generated/prisma/enums.ts";

export const ADOPTION_STATUS_TRANSITIONS: Record<AdoptionStatus, readonly AdoptionStatus[]> = {
  submitted: ["under_review", "withdrawn"],
  under_review: ["interview_scheduled", "approved", "rejected", "withdrawn"],
  interview_scheduled: ["interview_scheduled", "approved", "rejected", "withdrawn"],
  approved: ["completed"],
  rejected: [],
  withdrawn: [],
  completed: [],
};

/** Fixed venue where adoption meet-and-greets are held. */
export const INTERVIEW_VENUE = "City Vet Building";

/** Requests occupying a slot for an animal. */
export const OPEN_ADOPTION_STATUSES: readonly AdoptionStatus[] = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "approved",
];

export interface CreateAdoptionInput {
  animalId: string;
  housingType: HousingType;
  isOwnedProperty?: boolean;
  hasFencedArea?: boolean;
  householdMembers?: number;
  hasOtherPets?: boolean;
  otherPetsDetails?: string;
  priorPetExperience?: string;
  reasonForAdopting: string;
  validIdUrl: string;
  homePhotoUrl?: string;
  receiptReferenceNo?: string;
}

export interface ReviewAdoptionInput {
  status: Extract<AdoptionStatus, "under_review" | "interview_scheduled" | "approved" | "rejected">;
  decisionRemarks?: string;
  interviewSchedule?: Date;
}

export const adoptionDetailInclude = {
  animal: {
    select: {
      id: true,
      animalCode: true,
      name: true,
      species: true,
      primaryPhotoUrl: true,
      lifecycleStatus: true,
      media: {
        where: { mediaType: "photo" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { fileUrl: true },
      },
    },
  },
  adopter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profilePhotoUrl: true,
    },
  },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
  followups: { orderBy: { followupDate: "desc" } },
} satisfies Prisma.AdoptionRequestInclude;

export type AdoptionDetail = Prisma.AdoptionRequestGetPayload<{
  include: typeof adoptionDetailInclude;
}>;

export interface ListAdoptionsQuery {
  page?: number;
  pageSize?: number;
  status?: AdoptionStatus;
  animalId?: string;
  adopterUserId?: string;
}
