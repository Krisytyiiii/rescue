import { z } from "zod";

export const housingTypeValues = ["house", "apartment", "boarding", "other"] as const;
export const adoptionStatusValues = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "approved",
  "rejected",
  "withdrawn",
  "completed",
] as const;
export const followupMethodValues = ["in_app", "phone", "visit"] as const;

export const createAdoptionSchema = z.object({
  animalId: z.string().uuid(),
  housingType: z.enum(housingTypeValues),
  isOwnedProperty: z.coerce.boolean().optional(),
  hasFencedArea: z.coerce.boolean().optional(),
  householdMembers: z.coerce.number().int().min(1).max(50).optional(),
  hasOtherPets: z.coerce.boolean().optional(),
  otherPetsDetails: z.string().trim().max(255).optional(),
  priorPetExperience: z.string().trim().max(5_000).optional(),
  reasonForAdopting: z.string().trim().min(20).max(5_000),
  validIdUrl: z.string().url().max(255),
  homePhotoUrl: z.string().url().max(255).optional(),
  receiptReferenceNo: z.string().trim().max(60).optional(),
});

export const reviewAdoptionSchema = z.object({
  status: z.enum(["under_review", "interview_scheduled", "approved", "rejected"]),
  decisionRemarks: z.string().trim().max(255).optional(),
  interviewSchedule: z.coerce.date().optional(),
});

export const completeAdoptionSchema = z.object({
  releaseDate: z.coerce.date(),
  decisionRemarks: z.string().trim().max(255).optional(),
});

export const createFollowupSchema = z.object({
  followupDate: z.coerce.date(),
  method: z.enum(followupMethodValues).optional(),
  animalCondition: z.string().trim().max(255).optional(),
  remarks: z.string().trim().max(5_000).optional(),
});

export const listAdoptionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(adoptionStatusValues).optional(),
  animalId: z.string().uuid().optional(),
  adopterUserId: z.string().uuid().optional(),
});
