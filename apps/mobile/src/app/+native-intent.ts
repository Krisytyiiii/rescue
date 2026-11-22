/**
 * Expo Router reacts to every system deep link. The Google OAuth redirect
 * (`mobile://auth/google?...`) is consumed by `expo-web-browser`'s auth session,
 * so handing it to the router as well produces a stray "Unmatched Route" (or a
 * duplicate navigation). This hook stops that double handling.
 */

const GOOGLE_CALLBACK_ROUTE = "auth/google";

function normalize(path: string): string {
  const expoGo = path.match(/\/--\/(.*)$/);
  if (expoGo?.[1]) return expoGo[1];

  return path
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/{2,3}/, "")
    .replace(/^\//, "");
}

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  if (!path) return path;

  if (!normalize(path).startsWith(GOOGLE_CALLBACK_ROUTE)) return path;

  // Warm start: the in-app browser promise delivers the result to the screen
  // that started the flow. Returning null keeps that screen mounted.
  if (!initial) return null;

  // Cold start: the browser promise is gone, so land on the callback screen.
  return `/${GOOGLE_CALLBACK_ROUTE}`;
}
