import { NextResponse } from "next/server";

/** Deep link the mobile app uses by default when Google OAuth finishes. */
export const MOBILE_AUTH_SCHEME = process.env.MOBILE_APP_SCHEME ?? "mobile";

/**
 * Only allow the app's own scheme or an Expo Go URL. This prevents the OAuth
 * start route from becoming an open redirect.
 */
export function safeMobileRedirect(value: string | null): string | null {
  if (!value) return null;
  const allowed =
    value.startsWith(`${MOBILE_AUTH_SCHEME}://`) || value.startsWith("exp://");
  if (!allowed) return null;

  try {
    new URL(value);
    return value;
  } catch {
    return null;
  }
}

/**
 * Sends the in-app browser back to the Expo app with the OAuth outcome.
 * The mobile client parses these query params with its own auth repository.
 */
export function mobileAuthRedirect(
  params: Record<string, string | undefined>,
  redirectUrl?: string | null,
): NextResponse {
  const target =
    safeMobileRedirect(redirectUrl ?? null) ??
    `${MOBILE_AUTH_SCHEME}://auth/google`;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }

  const separator = target.includes("?") ? "&" : "?";
  return new NextResponse(null, {
    status: 307,
    headers: { location: `${target}${separator}${search.toString()}` },
  });
}
