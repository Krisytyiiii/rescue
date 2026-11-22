export type Role = "community_user" | "rescuer";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  accountStatus: string;
  barangayId: number | null;
  profilePhotoUrl: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Fields a signed-in user can change. Email is read-only. */
export interface UpdateProfileInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  phoneNumber?: string | null;
  barangayId?: number | null;
  profilePhotoUrl?: string | null;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  barangayId?: number;
  role: Role;
}

export type SignupResult =
  | { status: "verification_required"; user: AuthUser }
  | { status: "active"; session: Session }
  | { status: "pending"; user: AuthUser };

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface Barangay {
  id: number;
  name: string;
}

export type GoogleAuthIntent = "login" | "signup";

/** What the Google OAuth deep link told us about the account. */
export type GoogleAuthOutcome =
  | { status: "active"; session: Session }
  | { status: "pending"; email: string }
  | { status: "existing_account"; email: string }
  | { status: "not_registered"; email: string }
  | {
      status: "complete_profile";
      onboardingToken: string;
      email: string;
      firstName: string;
      lastName: string;
    }
  | { status: "cancelled" }
  | { status: "error"; message: string };

/** Profile details collected after Google confirms the email. */
export interface GoogleSignupInput {
  onboardingToken: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  barangayId?: number;
  role: Role;
}

/** Outcome of restoring a session when the app launches. */
export type RestoreResult =
  | { status: "none" }
  | { status: "valid"; user: AuthUser }
  | { status: "offline"; user: AuthUser };
