import { useRouter } from "expo-router";
import { useEffect } from "react";

/** How long the callback screen stays visible before returning to the form. */
const RETURN_DELAY_MS = 700;

/**
 * The OAuth redirect is a real deep link, so the OS hands it to the router in
 * parallel with the in-app browser promise. This screen keeps the hand-off
 * invisible, then returns the user to the screen that started the flow (the
 * login/signup view model has already handled the outcome by then).
 */
export function useGoogleCallbackViewModel() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Cold start from the deep link: land on home and let the session guard decide.
        router.replace("/");
      }
    }, RETURN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router]);
}
