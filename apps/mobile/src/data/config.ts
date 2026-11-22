import Constants from "expo-constants";

/**
 * Where the Next.js backend lives. Set EXPO_PUBLIC_API_URL to a URL the phone
 * can reach (for example your machine's LAN IP or a deployed domain).
 * During local development we fall back to the Metro host when it is an IP,
 * so a device on the same Wi-Fi can talk to the API automatically.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    "";
  const host = hostUri.split(":")[0];

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

export const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  console.log("[api] base url:", API_BASE_URL);
}

export function webUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
