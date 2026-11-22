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
} from "@/domain/auth";
import type {
  AuthGateway,
  AuthRepository,
  GoogleAuthBrowser,
  SessionStorage,
} from "@/domain/ports";

import { ApiError } from "./http";

/**
 * Coordinates the auth gateway and session storage.
 * Holds no transport details, so either dependency can be swapped in tests.
 */
export class DefaultAuthRepository implements AuthRepository {
  constructor(
    private readonly gateway: AuthGateway,
    private readonly storage: SessionStorage,
    private readonly browser: GoogleAuthBrowser,
  ) {}

  async login(input: LoginInput): Promise<Session> {
    const session = await this.gateway.login(input);
    await this.storage.save(session);
    return session;
  }

  async signup(input: SignupInput): Promise<SignupResult> {
    const result = await this.gateway.signup(input);
    if (result.status === "active") {
      await this.storage.save(result.session);
    }
    return result;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<SignupResult> {
    const result = await this.gateway.verifyEmail(input);
    if (result.status === "active") {
      await this.storage.save(result.session);
    }
    return result;
  }

  resendVerification(email: string): Promise<void> {
    return this.gateway.resendVerification(email);
  }

  async restoreSession(): Promise<RestoreResult> {
    const cached = await this.storage.read();
    if (!cached) return { status: "none" };

    try {
      const user = await this.gateway.fetchMe(cached.token);
      await this.storage.save({ token: cached.token, user });
      return { status: "valid", user };
    } catch (error) {
      // Offline: keep the cached session instead of forcing a sign-in.
      if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
        return { status: "offline", user: cached.user };
      }
      await this.storage.clear();
      return { status: "none" };
    }
  }

  async getCachedUser(): Promise<AuthUser | null> {
    const cached = await this.storage.read();
    return cached?.user ?? null;
  }

  async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const cached = await this.storage.read();
    if (!cached) throw new Error("Sign in to update your profile");

    const user = await this.gateway.updateProfile(cached.token, input);
    await this.storage.save({ token: cached.token, user });
    return user;
  }

  async uploadProfilePhoto(photo: ProfilePhotoUpload): Promise<string> {
    const cached = await this.storage.read();
    if (!cached) throw new Error("Sign in to change your photo");
    return this.gateway.uploadProfilePhoto(cached.token, photo);
  }

  signOut(): Promise<void> {
    return this.storage.clear();
  }

  loadBarangays(): Promise<Barangay[]> {
    return this.gateway.fetchBarangays();
  }

  async startGoogleAuth(intent: GoogleAuthIntent): Promise<GoogleAuthOutcome> {
    const redirect = await this.browser.open(
      this.gateway.googleAuthUrl(intent, this.browser.redirectUrl),
    );
    if (!redirect) return { status: "cancelled" };

    const params = parseRedirect(redirect);
    const status = params.get("status");
    const email = params.get("email") ?? "";

    if (status === "active") {
      const token = params.get("token");
      if (!token) return googleError();

      try {
        const user = await this.gateway.fetchMe(token);
        const session = { token, user };
        await this.storage.save(session);
        return { status: "active", session };
      } catch (error) {
        return {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "We couldn't finish signing you in with Google.",
        };
      }
    }

    if (status === "pending") return { status: "pending", email };
    if (status === "existing_account") {
      return { status: "existing_account", email };
    }
    if (status === "not_registered") return { status: "not_registered", email };

    if (status === "complete_profile") {
      const onboardingToken = params.get("onboarding") ?? "";
      if (!onboardingToken) return googleError();
      return {
        status: "complete_profile",
        onboardingToken,
        email,
        firstName: params.get("firstName") ?? "",
        lastName: params.get("lastName") ?? "",
      };
    }

    if (status === "cancelled") return { status: "cancelled" };

    return {
      status: "error",
      message:
        params.get("message") ?? "We couldn't complete Google sign-in.",
    };
  }

  async completeGoogleSignup(input: GoogleSignupInput): Promise<SignupResult> {
    const result = await this.gateway.completeGoogleSignup(input);
    if (result.status === "active") {
      await this.storage.save(result.session);
    }
    return result;
  }
}

function googleError(): GoogleAuthOutcome {
  return {
    status: "error",
    message: "We couldn't complete Google sign-in. Please try again.",
  };
}

/** Parses the `mobile://auth/google?...` query without relying on the URL polyfill. */
function parseRedirect(url: string): Map<string, string> {
  const queryIndex = url.indexOf("?");
  const query = queryIndex === -1 ? "" : url.slice(queryIndex + 1);
  const params = new Map<string, string>();

  for (const pair of query.split("&")) {
    if (!pair) continue;
    const equals = pair.indexOf("=");
    const rawKey = equals === -1 ? pair : pair.slice(0, equals);
    const rawValue = equals === -1 ? "" : pair.slice(equals + 1);
    const decode = (value: string) => {
      try {
        return decodeURIComponent(value.replace(/\+/g, " "));
      } catch {
        return value;
      }
    };
    params.set(decode(rawKey), decode(rawValue));
  }

  return params;
}
