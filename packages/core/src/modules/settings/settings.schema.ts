import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+639\d{9}$/, "Use the format +639XXXXXXXXX");

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  middleName: z.string().trim().max(60).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  phoneNumber: phone.optional().or(z.literal("")),
  profilePhotoUrl: z
    .string()
    .trim()
    .max(2048, "That photo URL is too long")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
