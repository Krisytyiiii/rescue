import type { AccountStatus, RoleName } from "../../generated/prisma/enums.ts";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  role: RoleName;
  accountStatus: AccountStatus;
  barangayId: number | null;
  profilePhotoUrl: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

export interface AuthSession {
  token: string;
  expiresIn: string;
  user: AuthUser;
}

/**
 * Community accounts are active immediately. Rescuer accounts start as
 * `pending` and receive no session until an admin approves them.
 */
export interface RegistrationResult {
  status: "active" | "pending";
  user: AuthUser;
  session: AuthSession | null;
}

export interface RegisterInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  barangayId?: number;
  role?: Extract<RoleName, "community_user" | "rescuer">;
}

/** Profile data collected after Google has verified the email. */
export interface OAuthRegisterInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  barangayId?: number;
  role?: Extract<RoleName, "community_user" | "rescuer">;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  role: RoleName;
  type: "access";
}

export interface ListUsersQuery {
  search?: string;
  role?: RoleName;
  status?: AccountStatus;
  barangayId?: number;
  page?: number;
  pageSize?: number;
}

/** Admin list row — never includes credentials or reset tokens. */
export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: RoleName;
  accountStatus: AccountStatus;
  barangay: string | null;
  profilePhotoUrl: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserRow {
  counts: {
    reports: number;
    verifiedReports: number;
    rescues: number;
    adoptionRequests: number;
  };
}
