import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { Session } from "@/domain/auth";
import type { SessionStorage } from "@/domain/ports";

const TOKEN_KEY = "furescue.session.token";
const USER_KEY = "furescue.session.user";

const deviceStorage = {
  async get(key: string) {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/** SecureStore on device, localStorage on web. */
export class SecureSessionStorage implements SessionStorage {
  async read(): Promise<Session | null> {
    const [token, rawUser] = await Promise.all([
      deviceStorage.get(TOKEN_KEY),
      deviceStorage.get(USER_KEY),
    ]);

    if (!token || !rawUser) return null;

    try {
      return { token, user: JSON.parse(rawUser) as Session["user"] };
    } catch {
      return null;
    }
  }

  async save(session: Session): Promise<void> {
    await Promise.all([
      deviceStorage.set(TOKEN_KEY, session.token),
      deviceStorage.set(USER_KEY, JSON.stringify(session.user)),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      deviceStorage.remove(TOKEN_KEY),
      deviceStorage.remove(USER_KEY),
    ]);
  }
}
