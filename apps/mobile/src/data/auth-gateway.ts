import type {
  AuthUser,
  Barangay,
  GoogleAuthIntent,
  GoogleSignupInput,
  Session,
  SignupResult,
} from "@/domain/auth";
import type { AuthGateway } from "@/domain/ports";

import { API_BASE_URL } from "./config";
import { ApiError } from "./http";
import { requestJson } from "./http";

interface LoginPayload {
  user: AuthUser;
  token: string;
  expiresIn: string;
}

interface SignupPayload {
  status: "verification_required" | "active" | "pending";
  user: AuthUser;
  token?: string;
}

interface BarangaysPayload {
  barangays: Barangay[];
}

/** HTTP implementation of the auth gateway (DIP: repository sees the port). */
export class HttpAuthGateway implements AuthGateway {
  async login(input: { email: string; password: string }): Promise<Session> {
    const data = await requestJson<LoginPayload>("/api/auth/login", {
      method: "POST",
      body: input,
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage:
        "We couldn't sign you in. Check your email and password and try again.",
    });

    return { user: data.user, token: data.token };
  }

  async signup(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    barangayId?: number;
    role: "community_user" | "rescuer";
  }): Promise<SignupResult> {
    const data = await requestJson<SignupPayload>("/api/auth/signup", {
      method: "POST",
      body: input,
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage:
        "We couldn't create your account. Please review your details and try again.",
    });

    if (data.status === "active") {
      if (!data.token) {
        throw new ApiError(
          "The server did not return a session token.",
          "INVALID_RESPONSE",
        );
      }
      return { status: "active", session: { token: data.token, user: data.user } };
    }

    if (data.status === "verification_required") {
      return { status: "verification_required", user: data.user };
    }

    return { status: "pending", user: data.user };
  }

  async verifyEmail(input: {
    email: string;
    code: string;
  }): Promise<SignupResult> {
    const data = await requestJson<SignupPayload>("/api/auth/verify-email", {
      method: "POST",
      body: input,
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage:
        "We couldn't verify that code. Check it and try again.",
    });

    if (data.status === "active") {
      if (!data.token) {
        throw new ApiError(
          "The server did not return a session token.",
          "INVALID_RESPONSE",
        );
      }
      return { status: "active", session: { token: data.token, user: data.user } };
    }

    return { status: "pending", user: data.user };
  }

  async resendVerification(email: string): Promise<void> {
    await requestJson<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: { email },
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage: "We couldn't send a new code. Please try again.",
    });
  }

  fetchMe(token: string): Promise<AuthUser> {
    return requestJson<{ user: AuthUser }>("/api/auth/me", {
      token,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage: "Your session has expired. Please sign in again.",
    }).then((data) => data.user);
  }

  fetchBarangays(): Promise<Barangay[]> {
    return requestJson<BarangaysPayload>("/api/barangays", {
      networkMessage: "Can't load the barangay list. Check your connection.",
      fallbackMessage: "Couldn't load the barangay list.",
    }).then((data) => data.barangays);
  }

  googleAuthUrl(intent: GoogleAuthIntent, redirectUrl: string): string {
    return `${API_BASE_URL}/api/auth/google/start?intent=${intent}&client=mobile&redirect=${encodeURIComponent(redirectUrl)}`;
  }

  async completeGoogleSignup(input: GoogleSignupInput): Promise<SignupResult> {
    const data = await requestJson<SignupPayload>("/api/auth/google/complete", {
      method: "POST",
      body: input,
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage:
        "We couldn't finish creating your account. Please try again.",
    });

    if (data.status === "active") {
      if (!data.token) {
        throw new ApiError(
          "The server did not return a session token.",
          "INVALID_RESPONSE",
        );
      }
      return { status: "active", session: { token: data.token, user: data.user } };
    }

    if (data.status === "verification_required") {
      return { status: "verification_required", user: data.user };
    }

    return { status: "pending", user: data.user };
  }
}
