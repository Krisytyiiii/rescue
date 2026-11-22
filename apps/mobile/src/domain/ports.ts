import type {
  AuthUser,
  Barangay,
  GoogleAuthIntent,
  GoogleAuthOutcome,
  GoogleSignupInput,
  LoginInput,
  ProfilePhotoUpload,
  RestoreResult,
  Session,
  SignupInput,
  SignupResult,
  UpdateProfileInput,
  VerifyEmailInput,
} from "./auth";
/**
 * Outbound port: everything the app needs from the auth backend.
 * Implemented by the data layer, consumed by the repository.
 */
export interface AuthGateway {
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<SignupResult>;
  verifyEmail(input: VerifyEmailInput): Promise<SignupResult>;
  resendVerification(email: string): Promise<void>;
  fetchMe(token: string): Promise<AuthUser>;
  updateProfile(token: string, input: UpdateProfileInput): Promise<AuthUser>;
  /** Uploads one local profile photo and returns its public URL. */
  uploadProfilePhoto(token: string, photo: ProfilePhotoUpload): Promise<string>;
  fetchBarangays(): Promise<Barangay[]>;
  googleAuthUrl(intent: GoogleAuthIntent, redirectUrl: string): string;
  completeGoogleSignup(input: GoogleSignupInput): Promise<SignupResult>;
}

/**
 * Opens the Google OAuth page in a secure in-app browser and resolves with the
 * deep link the backend redirects to, or `null` when the user dismisses it.
 */
export interface GoogleAuthBrowser {
  /** The scheme URL this build can be reopened with (Expo Go or dev build). */
  readonly redirectUrl: string;
  open(url: string): Promise<string | null>;
}

/** Outbound port for persisting the signed-in session on the device. */
export interface SessionStorage {
  read(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Inbound port: the only auth surface the UI layer is allowed to use.
 * Screens and view models depend on this, never on `fetch` or storage.
 */
export interface AuthRepository {
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<SignupResult>;
  verifyEmail(input: VerifyEmailInput): Promise<SignupResult>;
  resendVerification(email: string): Promise<void>;
  restoreSession(): Promise<RestoreResult>;
  getCachedUser(): Promise<AuthUser | null>;
  updateProfile(input: UpdateProfileInput): Promise<AuthUser>;
  /** Uploads a local profile photo and returns its public URL. */
  uploadProfilePhoto(photo: ProfilePhotoUpload): Promise<string>;
  signOut(): Promise<void>;
  loadBarangays(): Promise<Barangay[]>;
  /** Runs the Google OAuth browser hand-off and resolves what to show next. */
  startGoogleAuth(intent: GoogleAuthIntent): Promise<GoogleAuthOutcome>;
  completeGoogleSignup(input: GoogleSignupInput): Promise<SignupResult>;
}
