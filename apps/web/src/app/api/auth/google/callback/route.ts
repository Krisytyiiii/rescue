import { NextResponse, type NextRequest } from "next/server";

import { authService } from "@furescue/core";

import { mobileAuthRedirect, safeMobileRedirect } from "@/lib/auth/mobile-redirect";
import {
  clearOnboardingCookie,
  createOnboardingToken,
  setOnboardingCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fullName(metadata: Record<string, unknown> | undefined): {
  firstName: string;
  lastName: string;
} {
  const given = typeof metadata?.given_name === "string" ? metadata.given_name : "";
  const family = typeof metadata?.family_name === "string" ? metadata.family_name : "";
  if (given || family) return { firstName: given, lastName: family };

  const name = typeof metadata?.full_name === "string" ? metadata.full_name : "";
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const intent = url.searchParams.get("intent") === "login" ? "login" : "signup";
  const isMobile = url.searchParams.get("client") === "mobile";
  const appRedirect = safeMobileRedirect(url.searchParams.get("redirect"));
  const code = url.searchParams.get("code");

  if (!code) {
    if (isMobile) {
      return mobileAuthRedirect(
        {
          status: "cancelled",
          message: "Google sign-in was cancelled",
        },
        appRedirect,
      );
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google sign-in was cancelled")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const email = data.user?.email?.toLowerCase();

  if (error || !email) {
    const message = "Could not verify your Google account";
    if (isMobile) {
      return mobileAuthRedirect({ status: "error", message }, appRedirect);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  // Always clear the Supabase auth cookies; FurRescue uses its own JWT.
  await supabase.auth.signOut().catch(() => undefined);

  let registration = null;
  try {
    registration = await authService.findRegistrationByEmail(email);
  } catch {
    const message = "This account is not active. Contact an administrator.";
    if (isMobile) {
      return mobileAuthRedirect({ status: "error", message }, appRedirect);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  if (registration) {
    if (registration.status === "pending" || !registration.session) {
      if (isMobile) {
        return mobileAuthRedirect({ status: "pending", email }, appRedirect);
      }
      const response = NextResponse.redirect(
        `${origin}/signup/pending?email=${encodeURIComponent(email)}`,
      );
      clearOnboardingCookie(response);
      return response;
    }

    // The app asked to sign up, but this Google account already exists.
    if (isMobile && intent === "signup") {
      return mobileAuthRedirect(
        { status: "existing_account", email },
        appRedirect,
      );
    }

    if (isMobile) {
      return mobileAuthRedirect(
        {
          status: "active",
          token: registration.session.token,
          email,
        },
        appRedirect,
      );
    }

    const response = NextResponse.redirect(`${origin}/`);
    setSessionCookie(response, registration.session.token);
    clearOnboardingCookie(response);
    return response;
  }

  const { firstName, lastName } = fullName(data.user?.user_metadata);
  const pending = createOnboardingToken({ email, firstName, lastName });

  if (intent === "login") {
    if (isMobile) {
      return mobileAuthRedirect({ status: "not_registered", email }, appRedirect);
    }
    // Sign-in intent: no account exists → send to sign up with a clear message.
    const response = NextResponse.redirect(
      `${origin}/signup?email=${encodeURIComponent(email)}&reason=not_registered`,
    );
    setOnboardingCookie(response, pending);
    return response;
  }

  if (isMobile) {
    return mobileAuthRedirect(
      {
        status: "complete_profile",
        onboarding: pending,
        email,
        firstName,
        lastName,
      },
      appRedirect,
    );
  }

  // Sign-up intent: continue collecting the remaining profile details.
  const response = NextResponse.redirect(`${origin}/signup/complete`);
  setOnboardingCookie(response, pending);
  return response;
}
