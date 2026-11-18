import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Starts the Google OAuth redirect.
 * `intent=login`  → if the Google email has no account, bounce to /signup.
 * `intent=signup` → if the Google email has an account, sign in; otherwise
 *                   continue to the profile completion step.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") === "login" ? "login" : "signup";
  const origin = url.origin;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/google/callback?intent=${intent}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${origin}/${intent === "login" ? "login" : "signup"}?error=${encodeURIComponent(
        error?.message ?? "Could not start Google sign-in",
      )}`,
    );
  }

  return NextResponse.redirect(data.url);
}
