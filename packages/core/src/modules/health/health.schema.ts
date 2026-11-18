import { z } from "zod";

export const healthRecordTypeValues = [
  "checkup",
  "illness",
  "injury",
  "treatment",
  "surgery",
  "deworming",
  "spay_neuter",
  "other",
] as const;

export const measurementContextValues = [
  "resting",
  "post_activity",
  "under_stress",
  "during_exam",
] as const;

export const createHealthRecordSchema = z.object({
  animalId: z.string().uuid(),
  recordType: z.enum(healthRecordTypeValues),
  recordDate: z.coerce.date(),
  diagnosis: z.string().trim().max(255).optional(),
  treatment: z.string().trim().max(10_000).optional(),
  medication: z.string().trim().max(255).optional(),
  weightKg: z.coerce.number().min(0).max(200).optional(),
  followUpDate: z.coerce.date().optional(),
  remarks: z.string().trim().max(10_000).optional(),
});

export const createVaccinationSchema = z.object({
  animalId: z.string().uuid(),
  vaccineName: z.string().trim().min(1).max(100),
  doseNumber: z.coerce.number().int().min(1).max(50).optional(),
  dateGiven: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  batchLotNo: z.string().trim().max(40).optional(),
});

export const createHeartRateSchema = z.object({
  animalId: z.string().uuid(),
  healthRecordId: z.string().uuid().optional(),
  heartRateBpm: z.coerce.number().int().min(20).max(400),
  measurementContext: z.enum(measurementContextValues).optional(),
  measuredAt: z.coerce.date().optional(),
  notes: z.string().trim().max(255).optional(),
});
