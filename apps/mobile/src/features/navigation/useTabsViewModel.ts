import { useEffect, useState } from "react";

import { authRepository } from "@/data";
import type { AuthRepository } from "@/domain/ports";

import { tabItemsForRole, type TabItem } from "./tab-config";

/**
 * Role-aware navigation state for the tab bar. The tab bar only renders the
 * items returned here, so a rescuer never sees resident-only destinations.
 */
export function useTabsViewModel(auth: AuthRepository = authRepository) {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    auth
      .getCachedUser()
      .then((user) => {
        if (active) setRole(user?.role ?? null);
      })
      .catch(() => {
        if (active) setRole(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [auth]);

  const items: readonly TabItem[] = tabItemsForRole(role);

  return { role, items, ready };
}
