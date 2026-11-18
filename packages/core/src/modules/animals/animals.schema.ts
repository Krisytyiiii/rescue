import { z } from "zod";

export const speciesValues = ["dog", "cat"] as const;
export const breedTypeValues = ["aspin", "puspin", "mixed", "other"] as const;
export const sexValues = ["male", "female", "unknown"] as const;
export const animalSizeValues = ["small", "medium", "large"] as const;
export const originTypeValues = [
  "rescue_report",
  "community_post",
  "surrender",
  "born_in_care",
] as const;
export const lifecycleStatusValues = [
  "reported",
  "rescued",
  "under_care",
  "available",
  "adoption_pending",
  "adopted",
  "returned_to_owner",
  "deceased",
] as const;
export const listingStatusValues = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const createAnimalSchema = z.object({
  name: optionalText(60),
  species: z.enum(speciesValues),
  breedType: z.enum(breedTypeValues),
  sex: z.enum(sexValues),
  estimatedAgeMonths: z.coerce.number().int().min(0).max(600).optional(),
  size: z.enum(animalSizeValues).optional(),
  colorMarkings: optionalText(150),
  temperament: optionalText(255),
  weightKg: z.coerce.number().min(0).max(200).optional(),
  isNeutered: z.coerce.boolean().optional(),
  microchipNo: optionalText(30),
  originType: z.enum(originTypeValues),
  sourceReportId: z.string().uuid().optional(),
  intakeDate: z.coerce.date().optional(),
  description: z.string().trim().max(10_000).optional(),
  media: z
    .array(
      z.object({
        mediaType: z.enum(["photo", "video"]),
        fileUrl: z.string().url().max(255),
        caption: optionalText(150),
        sortOrder: z.coerce.number().int().min(0).max(255).optional(),
      }),
    )
    .max(20)
    .optional(),
});

export const updateAnimalSchema = z.object({
  name: optionalText(60),
  breedType: z.enum(breedTypeValues).optional(),
  sex: z.enum(sexValues).optional(),
  estimatedAgeMonths: z.coerce.number().int().min(0).max(600).optional(),
  size: z.enum(animalSizeValues).optional(),
  colorMarkings: optionalText(150),
  temperament: optionalText(255),
  weightKg: z.coerce.number().min(0).max(200).optional(),
  isNeutered: z.coerce.boolean().optional(),
  microchipNo: optionalText(30),
  primaryPhotoUrl: z.string().url().max(255).optional(),
  model3dUrl: z.string().url().max(255).optional(),
  model3dThumbnailUrl: z.string().url().max(255).optional(),
  description: z.string().trim().max(10_000).optional(),
  listingStatus: z.enum(listingStatusValues).optional(),
});

export const listAnimalsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  species: z.enum(speciesValues).optional(),
  sex: z.enum(sexValues).optional(),
  size: z.enum(animalSizeValues).optional(),
  lifecycleStatus: z.enum(lifecycleStatusValues).optional(),
  listingStatus: z.enum(listingStatusValues).optional(),
  search: z.string().trim().max(120).optional(),
  availableOnly: z.coerce.boolean().optional(),
});

export const updateLifecycleSchema = z.object({
  status: z.enum(lifecycleStatusValues),
  remarks: z.string().trim().max(255).optional(),
});

export const moderateListingSchema = z.object({
  listingStatus: z.enum(["published", "rejected", "archived"]),
  remarks: z.string().trim().max(255).optional(),
});
