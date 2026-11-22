import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const phone = z
  .string()
  .trim()
  .regex(/^\+639\d{9}$/, "Use the format +639XXXXXXXXX");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  middleName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().min(1).max(60),
  email,
  phoneNumber: phone.optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/\d/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol"),
  barangayId: z.coerce.number().int().positive().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const resendVerificationSchema = z.object({
  email,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

/** Self-service profile fields. Email and role are intentionally immutable. */
export const updateAccountProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    middleName: z.string().trim().max(60).nullable().optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    phoneNumber: z
      .union([phone, z.literal(""), z.null()])
      .optional(),
    barangayId: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional(),
    profilePhotoUrl: z
      .union([z.string().trim().url("Enter a valid image URL").max(500), z.literal(""), z.null()])
      .optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "No profile changes to save",
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
