import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  AnimalSize,
  BreedType,
  LifecycleStatus,
  ListingStatus,
  OriginType,
  Sex,
  Species,
} from "../../generated/prisma/enums.ts";

export const ANIMAL_LIFECYCLE_TRANSITIONS: Record<LifecycleStatus, readonly LifecycleStatus[]> = {
  reported: ["rescued", "under_care", "returned_to_owner", "deceased"],
  rescued: ["under_care", "returned_to_owner", "deceased"],
  under_care: ["available", "adoption_pending", "returned_to_owner", "deceased"],
  available: ["adoption_pending", "under_care", "deceased"],
  adoption_pending: ["adopted", "available", "under_care"],
  adopted: [],
  returned_to_owner: [],
  deceased: [],
};

export const animalDetailInclude = {
  media: { orderBy: { sortOrder: "asc" } },
  sourceReport: {
    select: {
      id: true,
      reportCode: true,
      status: true,
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 10,
        select: {
          id: true,
          oldStatus: true,
          newStatus: true,
          remarks: true,
          changedAt: true,
        },
      },
    },
  },
  postedBy: {
    select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
  },
  healthRecords: { orderBy: { recordDate: "desc" }, take: 10 },
  vaccinations: { orderBy: { dateGiven: "desc" }, take: 10 },
  heartRateLogs: { orderBy: { measuredAt: "desc" }, take: 1 },
} satisfies Prisma.AnimalInclude;

export type AnimalDetail = Prisma.AnimalGetPayload<{ include: typeof animalDetailInclude }>;

export interface CreateAnimalInput {
  name?: string;
  species: Species;
  breedType: BreedType;
  sex: Sex;
  estimatedAgeMonths?: number;
  size?: AnimalSize;
  colorMarkings?: string;
  temperament?: string;
  weightKg?: number;
  isNeutered?: boolean;
  microchipNo?: string;
  originType: OriginType;
  sourceReportId?: string;
  listingStatus?: ListingStatus;
  intakeDate?: Date;
  description?: string;
  media?: Array<{ mediaType: "photo" | "video"; fileUrl: string; caption?: string; sortOrder?: number }>;
}

export interface UpdateAnimalInput {
  name?: string;
  breedType?: BreedType;
  sex?: Sex;
  estimatedAgeMonths?: number;
  size?: AnimalSize;
  colorMarkings?: string;
  temperament?: string;
  weightKg?: number;
  isNeutered?: boolean;
  microchipNo?: string;
  primaryPhotoUrl?: string;
  model3dUrl?: string;
  model3dThumbnailUrl?: string;
  description?: string;
  listingStatus?: ListingStatus;
}

export interface ListAnimalsQuery {
  page?: number;
  pageSize?: number;
  species?: Species;
  sex?: Sex;
  size?: AnimalSize;
  lifecycleStatus?: LifecycleStatus;
  listingStatus?: ListingStatus;
  originType?: OriginType;
  postedByUserId?: string;
  search?: string;
  availableOnly?: boolean;
}
