import { useCallback, useEffect, useState } from "react";

import {
  authRepository,
  chatPreviewDataSource,
  residentContactsDataSource,
  rescuerAssignmentsDataSource,
} from "@/data";
import { selectRescuerContacts } from "@/domain/rescuer";

import type {
  ChatPreviewDataSource,
  ResidentContactsDataSource,
} from "@/data/messaging-gateway";
import type { RescuerHomeDataSource } from "@/data/rescuer-home";
import type { AuthRepository } from "@/domain/ports";

export type ChatContactRole = "admin" | "rescuer" | "reporter";

export interface ChatContact {
  userId: string;
  fullName: string;
  role: ChatContactRole;
  profilePhotoUrl: string | null;
  reportCodes: string[];
  /** Latest message body exchanged with this contact, if any. */
  lastMessage: string | null;
  lastMessageAt: string | null;
  /** True when the signed-in person sent the latest message. */
  lastMessageMine: boolean;
  unreadCount: number;
}

type ViewerRole = "rescuer" | "community_user" | null;

interface Options {
  auth?: AuthRepository;
  assignments?: RescuerHomeDataSource;
  residents?: ResidentContactsDataSource;
  previews?: ChatPreviewDataSource;
}

/**
 * The people the signed-in person can open a direct chat with. Rescuers see
 * their dispatcher and the reporters they are assigned to; residents see the
 * City Vet team and the rescuers assigned to their reports.
 *
 * Contacts are ordered by the newest message sent or received, and carry the
 * latest message so the list can preview it.
 */
export function useChatContactsViewModel({
  auth = authRepository,
  assignments = rescuerAssignmentsDataSource,
  residents = residentContactsDataSource,
  previews = chatPreviewDataSource,
}: Options = {}) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = await auth.getCachedUser();
    const role = (user?.role as ViewerRole) ?? null;
    setViewerRole(role);

    const [base, latest] = await Promise.all([
      role === "rescuer"
        ? assignments
            .loadHome()
            .then((snapshot) => selectRescuerContacts(snapshot.assignments))
        : residents.loadContacts().then((items) => items.map((item) => ({ ...item }))),
      // Previews are an enhancement: the list still renders without them.
      previews.loadPreviews().catch(() => []),
    ]);

    const previewByContact = new Map(
      latest.map((preview) => [preview.contactUserId, preview]),
    );

    const merged = base.map<ChatContact>((contact) => {
      const preview = previewByContact.get(contact.userId);
      return {
        ...contact,
        lastMessage: preview?.lastMessage ?? null,
        lastMessageAt: preview?.lastMessageAt ?? null,
        lastMessageMine: preview?.lastMessageMine ?? false,
        unreadCount: preview?.unreadCount ?? 0,
      };
    });

    merged.sort((a, b) => {
      const aTime = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
      const bTime = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.fullName.localeCompare(b.fullName);
    });

    setContacts(merged);
    setError(null);
  }, [assignments, auth, previews, residents]);

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
