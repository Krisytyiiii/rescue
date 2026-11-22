import { useCallback, useEffect, useState } from "react";

import {
  authRepository,
  residentContactsDataSource,
  rescuerAssignmentsDataSource,
} from "@/data";
import { selectRescuerContacts } from "@/domain/rescuer";

import type { ResidentContactsDataSource } from "@/data/messaging-gateway";
import type { RescuerHomeDataSource } from "@/data/rescuer-home";
import type { AuthRepository } from "@/domain/ports";

export type ChatContactRole = "admin" | "rescuer" | "reporter";

export interface ChatContact {
  userId: string;
  fullName: string;
  role: ChatContactRole;
  profilePhotoUrl: string | null;
  reportCodes: string[];
}

type ViewerRole = "rescuer" | "community_user" | null;

interface Options {
  auth?: AuthRepository;
  assignments?: RescuerHomeDataSource;
  residents?: ResidentContactsDataSource;
}

/**
 * The people the signed-in person can open a direct chat with. Rescuers see
 * their dispatcher and the reporters they are assigned to; residents see the
 * City Vet team and the rescuers assigned to their reports.
 */
export function useChatContactsViewModel({
  auth = authRepository,
  assignments = rescuerAssignmentsDataSource,
  residents = residentContactsDataSource,
}: Options = {}) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = await auth.getCachedUser();
    const role = (user?.role as ViewerRole) ?? null;
    setViewerRole(role);

    if (role === "rescuer") {
      const snapshot = await assignments.loadHome();
      setContacts(selectRescuerContacts(snapshot.assignments));
    } else {
      const next = await residents.loadContacts();
      setContacts(next.map((contact) => ({ ...contact })));
    }
    setError(null);
  }, [assignments, auth, residents]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your contacts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    try {
      await load();
    } catch {
      setError("Couldn't load your contacts.");
    }
  }, [load]);

  return { contacts, viewerRole, loading, error, reload };
}
