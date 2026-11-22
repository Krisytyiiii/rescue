import { NextResponse, type NextRequest } from "next/server";

import {
  mobileAuthRedirect,
  safeMobileRedirect,
} from "@/lib/auth/mobile-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Starts the Google OAuth redirect.
 * `intent=login`  → if the Google email has no account, bounce to /signup.
 * `intent=signup` → if the Google email has an account, sign in; otherwise
 *                   continue to the profile completion step.
 * `client=mobile` → return to the Expo app through the `mobile://` deep link.
 * `redirect`      → optionally the exact deep link (Expo Go vs dev build).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") === "login" ? "login" : "signup";
  const client = url.searchParams.get("client") === "mobile" ? "mobile" : "web";
  const origin = url.origin;
  const appRedirect = safeMobileRedirect(url.searchParams.get("redirect"));

  const callback = new URLSearchParams({ intent, client });
  if (appRedirect) callback.set("redirect", appRedirect);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/google/callback?${callback.toString()}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    const message = error?.message ?? "Could not start Google sign-in";
    if (client === "mobile") {
      return mobileAuthRedirect({ status: "error", message }, appRedirect);
    }
    return NextResponse.redirect(
      `${origin}/${intent === "login" ? "login" : "signup"}?error=${encodeURIComponent(message)}`,
    );
  }

  return NextResponse.redirect(data.url);
}
