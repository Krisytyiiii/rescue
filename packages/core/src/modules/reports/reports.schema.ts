import { z } from "zod";

export const reportTypeValues = ["stray", "injured", "abandoned"] as const;
export const reportSpeciesValues = ["dog", "cat", "unknown"] as const;
export const urgencyValues = ["low", "medium", "high", "critical"] as const;
export const reportStatusValues = [
  "submitted",
  "verified",
  "assigned",
  "in_progress",
  "rescued",
  "unable_to_locate",
  "rejected",
  "closed",
] as const;
export const mediaTypeValues = ["photo", "video"] as const;

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const createReportSchema = z.object({
  reportType: z.enum(reportTypeValues),
  species: z.enum(reportSpeciesValues),
  description: z.string().trim().min(10, "Please describe the situation").max(5_000),
  urgencyLevel: z.enum(urgencyValues),
  animalCount: z.coerce.number().int().min(1).max(50).default(1),
  latitude,
  longitude,
  barangayId: z.coerce.number().int().positive().optional(),
  locationLandmark: z.string().trim().max(255).optional(),
  submittedAt: z.coerce.date().optional(),
  media: z
    .array(
      z.object({
        mediaType: z.enum(mediaTypeValues),
        fileUrl: z.string().url().max(255),
        fileSizeKb: z.coerce.number().int().positive().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const listReportsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(reportStatusValues).optional(),
  reportType: z.enum(reportTypeValues).optional(),
  species: z.enum(reportSpeciesValues).optional(),
  urgencyLevel: z.enum(urgencyValues).optional(),
  barangayId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  includeDuplicates: z.coerce.boolean().optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(reportStatusValues),
  remarks: z.string().trim().max(255).optional(),
  rejectionReason: z.string().trim().max(255).optional(),
});

export const assignRescuerSchema = z.object({
  rescuerUserId: z.string().uuid(),
  notes: z.string().trim().max(1_000).optional(),
});

export type CreateReportSchema = z.infer<typeof createReportSchema>;
export type ListReportsSchema = z.infer<typeof listReportsSchema>;
export type UpdateReportStatusSchema = z.infer<typeof updateReportStatusSchema>;
export type AssignRescuerSchema = z.infer<typeof assignRescuerSchema>;
