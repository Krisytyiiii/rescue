import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import type { GoogleAuthBrowser } from "@/domain/ports";

/**
 * Resolves to `mobile://auth/google` in a development/production build and
 * `exp://<host>/--/auth/google` inside Expo Go. The backend receives this URL
 * and redirects to it after exchanging the Google code.
 */
export const GOOGLE_REDIRECT_URL = Linking.createURL("auth/google");

/** Opens Google OAuth in a secure in-app browser and captures the deep link. */
export class ExpoGoogleAuthBrowser implements GoogleAuthBrowser {
  readonly redirectUrl = GOOGLE_REDIRECT_URL;

  async open(url: string): Promise<string | null> {
    const result = await WebBrowser.openAuthSessionAsync(
      url,
      GOOGLE_REDIRECT_URL,
    );

    return result.type === "success" ? result.url : null;
  }
}
