import type {
  AuthUser,
  Barangay,
  GoogleAuthIntent,
  GoogleSignupInput,
  ProfilePhotoUpload,
  Session,
  SignupResult,
  UpdateProfileInput,
} from "@/domain/auth";
import type { AuthGateway } from "@/domain/ports";
import { File as ExpoFile, UploadType } from "expo-file-system";
import { Platform } from "react-native";

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

  updateProfile(
    token: string,
    input: UpdateProfileInput,
  ): Promise<AuthUser> {
    return requestJson<{ user: AuthUser }>("/api/auth/me", {
      method: "PATCH",
      body: input,
      token,
      mobile: true,
      networkMessage:
        "Can't reach FuRescue. Check your connection and try again.",
      fallbackMessage: "We couldn't save your profile. Please try again.",
    }).then((data) => data.user);
  }

  async uploadProfilePhoto(
    token: string,
    photo: ProfilePhotoUpload,
  ): Promise<string> {
    const endpoint = `${API_BASE_URL}/api/profile/uploads`;
    const headers = { authorization: `Bearer ${token}` };
    const supported = ["image/jpeg", "image/png", "image/webp"] as const;
    const type = supported.includes(photo.mimeType as (typeof supported)[number])
      ? (photo.mimeType as string)
      : "image/jpeg";
    const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    const base =
      photo.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `profile.${extension}`;
    const name = /\.[a-z0-9]+$/i.test(base) ? base : `${base}.${extension}`;

    if (Platform.OS !== "web") {
      try {
        const nativeFile = new ExpoFile(photo.uri);
        if (!nativeFile.exists) {
          throw new ApiError(
            "That photo is no longer available. Please choose it again.",
            "UPLOAD_FAILED",
          );
        }

        const result = await nativeFile.upload(endpoint, {
          httpMethod: "POST",
          uploadType: UploadType.MULTIPART,
          fieldName: "file",
          mimeType: type,
          headers,
        });

        const envelope = parseUpload(result.body);
        if (
          result.status < 200 ||
          result.status >= 300 ||
          !envelope?.ok ||
          !envelope.data?.url
        ) {
          throw new ApiError(
            envelope?.error?.message ?? "We couldn't upload that photo.",
            "UPLOAD_FAILED",
            result.status,
          );
        }
        return envelope.data.url;
      } catch (cause) {
        if (cause instanceof ApiError) throw cause;
        if (__DEV__) console.warn("[api] profile upload failed", cause);
        throw new ApiError(
          __DEV__
            ? `We couldn't upload that photo. (${cause instanceof Error ? cause.message : "unknown error"})`
            : "We couldn't upload that photo. Check your connection and try again.",
          "UPLOAD_FAILED",
        );
      }
    }

    const form = new FormData();
    const blob = await fetch(photo.uri)
      .then((response) => response.blob())
      .catch(() => {
        throw new ApiError(
          "We couldn't read that photo. Try choosing it again.",
          "UPLOAD_FAILED",
        );
      });
    form.append("file", blob, name);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: form,
      });
    } catch (cause) {
      throw new ApiError(
        __DEV__
          ? `We couldn't upload that photo. (${cause instanceof Error ? cause.message : "network error"})`
          : "We couldn't upload that photo. Check your connection and try again.",
        "UPLOAD_FAILED",
      );
    }

    const envelope = parseUpload(await response.text().catch(() => ""));
    if (!response.ok || !envelope?.ok || !envelope.data?.url) {
      throw new ApiError(
        envelope?.error?.message ?? "We couldn't upload that photo.",
        "UPLOAD_FAILED",
        response.status,
      );
    }
    return envelope.data.url;
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

interface UploadEnvelope {
  ok: boolean;
  data?: { url?: string };
  error?: { message?: string };
}

function parseUpload(body: string): UploadEnvelope | null {
  try {
    return JSON.parse(body) as UploadEnvelope;
  } catch {
    return null;
  }
}
