import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { messagingDataSource } from "@/data";
import type { MessagingDataSource } from "@/data/messaging-gateway";
import type { ChatMessage, ChatThread } from "@/domain/messaging";

const POLL_MS = 3000;
/** Wait this long for the live stream before falling back to polling. */
const STREAM_GRACE_MS = 1500;

interface Options {
  messages?: MessagingDataSource;
}

/**
 * Loads one direct chat and keeps it fresh while the screen is focused.
 * Live updates arrive over SSE; polling only runs as a fallback. Outgoing
 * messages are shown immediately and delivered in order in the background,
 * so the composer never waits on the network.
 */
export function useChatViewModel(
  contactUserId: string,
  contactName?: string,
  { messages = messagingDataSource }: Options = {},
) {
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const streamLive = useRef(false);
  const pendingCount = useRef(0);
  const failures = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const itemsRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const applyThread = useCallback((next: ChatThread) => {
    setThread(next);
    setItems(next.messages);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const tick = async () => {
        if (inFlight.current || streamLive.current || pendingCount.current > 0) {
          return;
        }
        inFlight.current = true;
        try {
          const next = await messages.loadThread(contactUserId);
          if (active) {
            failures.current = 0;
            if (next) applyThread(next);
            setReady(true);
            setLoadError(null);
          }
        } catch {
          // A single failed poll is often transient; only surface repeated
          // failures so the screen doesn't flash an error while connecting.
          if (active) {
            failures.current += 1;
            if (failures.current >= 2) {
              setLoadError("Couldn't load this chat.");
            }
          }
        } finally {
          inFlight.current = false;
          if (active) setLoading(false);
        }
      };

      // Live push is the primary source; polling is only a fallback.
      const unsubscribe = messages.subscribeThread?.(contactUserId, {
        onLive: () => {
          if (!active) return;
          streamLive.current = true;
          failures.current = 0;
          setReady(true);
          setLoading(false);
          setLoadError(null);
        },
        onThread: (next) => {
          if (!active) return;
          streamLive.current = true;
          failures.current = 0;
          applyThread(next);
          setReady(true);
          setLoading(false);
          setLoadError(null);
        },
        onDisconnect: () => {
          streamLive.current = false;
        },
      });

      const fallback = setTimeout(() => {
        if (!streamLive.current) void tick();
      }, STREAM_GRACE_MS);
      const timer = setInterval(() => void tick(), POLL_MS);

      return () => {
        active = false;
        clearTimeout(fallback);
        clearInterval(timer);
        streamLive.current = false;
        unsubscribe?.();
      };
    }, [applyThread, contactUserId, messages]),
  );

  const send = useCallback(
    (raw: string) => {
      const body = raw.trim();
      if (!body) return false;

      const optimistic: ChatMessage = {
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        body,
        sentAt: new Date().toISOString(),
        mine: true,
        senderName: "You",
        senderRole: "rescuer",
        attachmentUrl: null,
        status: "sending",
      };

      setError(null);
      setPending((current) => [...current, optimistic]);
      pendingCount.current += 1;

      // Deliver in order without blocking the composer. `startThread` reuses
      // the existing conversation (and reopens it if closed), so later sends
      // never depend on a stale conversation id.
      queue.current = queue.current.then(async () => {
        try {
          const created = await messages.startThread(contactUserId, body);
          applyThread(created);
        } catch {
          setError("Couldn't send that message. Try again.");
        } finally {
          setPending((current) =>
            current.filter((item) => item.id !== optimistic.id),
          );
          pendingCount.current -= 1;
        }
      });

      return true;
    },
    [applyThread, contactUserId, messages],
  );

  const deleteMessage = useCallback(
    async (messageId: string, scope: "me" | "everyone") => {
      const previous = itemsRef.current;
      setItems((current) =>
        scope === "me"
          ? current.filter((item) => item.id !== messageId)
          : current.map((item) =>
              item.id === messageId ? { ...item, isDeleted: true } : item,
            ),
      );
      setPending((current) =>
        current.filter((item) => item.id !== messageId),
      );

      try {
        await messages.deleteMessage(messageId, scope);
        return true;
      } catch {
        setItems(previous);
        setError("Couldn't delete that message. Try again.");
        return false;
      }
    },
    [messages],
  );

  return {
    contactName: thread?.contactName ?? contactName ?? "Chat",
    messages: pending.length > 0 ? [...items, ...pending] : items,
    loading,
    ready,
    error,
    loadError,
    send,
    deleteMessage,
  };
}
