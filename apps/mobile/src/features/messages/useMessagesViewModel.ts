import { useCallback, useEffect, useState } from "react";

import { rescuerAssignmentsDataSource } from "@/data";
import { selectRescuerContacts, type RescuerContact } from "@/domain/rescuer";

import type { RescuerHomeDataSource } from "@/data/rescuer-home";

interface Options {
  assignments?: RescuerHomeDataSource;
}

/** The people a rescuer can open a direct chat with. */
export function useMessagesViewModel({
  assignments = rescuerAssignmentsDataSource,
}: Options = {}) {
  const [contacts, setContacts] = useState<RescuerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const snapshot = await assignments.loadHome();
    setContacts(selectRescuerContacts(snapshot.assignments));
    setError(null);
  }, [assignments]);

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

  return { contacts, loading, error, reload };
}
