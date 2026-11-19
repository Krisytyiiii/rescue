import type { BadgeTone } from "@/components/ui/badge";

export type UserRole = "community_user" | "rescuer" | "admin";
export type UserStatus = "pending" | "active" | "suspended" | "deactivated";

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  accountStatus: UserStatus;
  barangay: string | null;
  profilePhotoUrl: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetail extends UserRow {
  counts: {
    reports: number;
    verifiedReports: number;
    rescues: number;
    adoptionRequests: number;
  };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  community_user: "Community",
  rescuer: "Rescuer",
  admin: "Admin",
};

export const ROLE_TONES: Record<UserRole, BadgeTone> = {
  community_user: "neutral",
  rescuer: "info",
  admin: "pending",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
  deactivated: "Deactivated",
};

export const STATUS_TONES: Record<UserStatus, BadgeTone> = {
  pending: "pending",
  active: "success",
  suspended: "danger",
  deactivated: "neutral",
};

export const ROLE_OPTIONS = [
  { value: "", label: "Any role" },
  { value: "community_user", label: "Community" },
  { value: "rescuer", label: "Rescuer" },
  { value: "admin", label: "Admin" },
];

export const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
];

export const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatLastLogin(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return dateFormatter.format(date);
}
