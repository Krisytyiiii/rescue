import { NextResponse, type NextRequest } from "next/server";

import { authService } from "@furescue/core";

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
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google sign-in was cancelled")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const email = data.user?.email?.toLowerCase();

  if (error || !email) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Could not verify your Google account")}`,
    );
  }

  // Always clear the Supabase auth cookies; FurRescue uses its own JWT.
  await supabase.auth.signOut().catch(() => undefined);

  let registration = null;
  try {
    registration = await authService.findRegistrationByEmail(email);
  } catch {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "This account is not active. Contact an administrator.",
      )}`,
    );
  }

  if (registration) {
    if (registration.status === "pending" || !registration.session) {
      const response = NextResponse.redirect(
        `${origin}/signup/pending?email=${encodeURIComponent(email)}`,
      );
      clearOnboardingCookie(response);
      return response;
    }

    const response = NextResponse.redirect(`${origin}/`);
    setSessionCookie(response, registration.session.token);
    clearOnboardingCookie(response);
    return response;
  }

  const { firstName, lastName } = fullName(data.user?.user_metadata);
  const pending = createOnboardingToken({ email, firstName, lastName });

  if (intent === "login") {
    // Sign-in intent: no account exists → send to sign up with a clear message.
    const response = NextResponse.redirect(
      `${origin}/signup?email=${encodeURIComponent(email)}&reason=not_registered`,
    );
    setOnboardingCookie(response, pending);
    return response;
  }

  // Sign-up intent: continue collecting the remaining profile details.
  const response = NextResponse.redirect(`${origin}/signup/complete`);
  setOnboardingCookie(response, pending);
  return response;
}
