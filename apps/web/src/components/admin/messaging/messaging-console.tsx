"use client";

import {
  FileWarning,
  HeartHandshake,
  Inbox,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { SecondaryTabFilters } from "@/components/ui/secondary-tab-filters";
import { TabFilters } from "@/components/ui/tab-filters";
import { Textarea } from "@/components/ui/textarea";
import { OverlayCard } from "@/components/ui/overlay-card";
import { useToast } from "@/components/ui/toast";
import type {
  ConversationDetailRow,
  ConversationListRow,
  MessagingCounts,
  MessagingMessageRow,
  ParticipantCandidateRow,
} from "@furescue/core";

type ContextTab = "all" | "closed";

const TIME = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
});
const DAY = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function relativeTime(value: string): string {
  const date = new Date(value);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24 && date.getDate() === new Date(now).getDate()) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return DAY.format(date);
}

function dayKey(value: string): string {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return DAY.format(date);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "rescuer":
      return "Rescuer";
    default:
      return "Community";
  }
}

function roleTone(role: string): "neutral" | "info" | "pending" {
  switch (role) {
    case "admin":
      return "pending";
    case "rescuer":
      return "info";
    default:
      return "neutral";
  }
}

function contextIcon(kind: ConversationListRow["contextType"]) {
  if (kind === "report") return FileWarning;
  if (kind === "adoption_request") return HeartHandshake;
  return MessageSquare;
}

/**
 * Conversations are person-to-person, so the title falls back to the people in
 * the thread (admins coordinate but are not the subject of the conversation).
 */
function conversationTitle(
  conversation: ConversationListRow | ConversationDetailRow,
): string {
  const people = conversation.participants
    .filter((participant) => participant.role !== "admin")
    .map((participant) => participant.fullName);
  const fallback = conversation.participants.map(
    (participant) => participant.fullName,
  );
  return (
    people.join(", ") ||
    conversation.subject ||
    fallback.join(", ") ||
    "Untitled conversation"
  );
}

interface MessagingConsoleProps {
  conversations: ConversationListRow[];
  counts: MessagingCounts;
  currentUserId: string;
  initialConversationId?: string | null;
}

export function MessagingConsole({
  conversations,
  counts,
  currentUserId,
  initialConversationId = null,
}: MessagingConsoleProps) {
  const toast = useToast();

  const [items, setItems] = useState(conversations);
  const [tab, setTab] = useState<ContextTab>("all");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailRow | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [draft, setDraft] = useState("");

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessagingMessageRow | null>(null);
  const [participantToRemove, setParticipantToRemove] = useState<{
    userId: string;
    fullName: string;
  } | null>(null);

  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participantQuery, setParticipantQuery] = useState("");
  const [candidates, setCandidates] = useState<ParticipantCandidateRow[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newQuery, setNewQuery] = useState("");
  const [newCandidates, setNewCandidates] = useState<ParticipantCandidateRow[]>([]);
  const [searchingNew, setSearchingNew] = useState(false);
  const [newRecipient, setNewRecipient] = useState<ParticipantCandidateRow | null>(
    null,
  );
  const [newBody, setNewBody] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const openedInitialRef = useRef(false);

  useEffect(() => {
    // Merge server rows instead of replacing the list: a just-started
    // conversation stays visible until the refreshed props include it.
    setItems((current) => {
      const serverIds = new Set(conversations.map((item) => item.id));
      const pending = current.filter((item) => !serverIds.has(item.id));
      return [...pending, ...conversations];
    });
  }, [conversations]);

  useEffect(() => {
    if (openedInitialRef.current || !initialConversationId) return;
    openedInitialRef.current = true;
    void openConversation(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [detail?.messages.length, detail?.id]);

  // Live thread updates from Supabase Realtime. The page-level subscription
  // refreshes server props; this keeps the open conversation in sync.
  useEffect(() => {
    function onRealtime(event: Event) {
      const payload = (event as CustomEvent<{ table?: string }>).detail;
      if (!payload?.table || !selectedId) return;
      if (
        !["messages", "conversations", "conversation_participants"].includes(
          payload.table,
        )
      ) {
        return;
      }
      void refreshDetail(selectedId);
    }
    window.addEventListener("admin:realtime", onRealtime);
    return () => window.removeEventListener("admin:realtime", onRealtime);
  }, [selectedId]);

  useEffect(() => {
    if (!addingParticipant || !detail) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingPeople(true);
      try {
        const response = await fetch(
          `/api/admin/conversations/${detail.id}/participants?q=${encodeURIComponent(participantQuery)}`,
        );
        const body = await response.json().catch(() => null);
        if (!cancelled && response.ok) {
          setCandidates(body.data as ParticipantCandidateRow[]);
        }
      } catch {
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setSearchingPeople(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [addingParticipant, participantQuery, detail]);

  useEffect(() => {
    if (!newMessageOpen) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingNew(true);
      try {
        const response = await fetch(
          `/api/admin/conversations/candidates?q=${encodeURIComponent(newQuery)}`,
        );
        const body = await response.json().catch(() => null);
        if (!cancelled && response.ok) {
          setNewCandidates(body.data as ParticipantCandidateRow[]);
        }
      } catch {
        if (!cancelled) setNewCandidates([]);
      } finally {
        if (!cancelled) setSearchingNew(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [newMessageOpen, newQuery]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((conversation) => {
      if (tab === "closed") {
        if (conversation.status !== "closed") return false;
      } else if (conversation.status !== "open") {
        return false;
      }
      if (unreadOnly && conversation.unreadCount === 0) return false;
      if (needsReplyOnly && !conversation.needsReply) return false;
      if (!needle) return true;
      const haystack = [
        conversation.subject ?? "",
        conversation.context.code ?? "",
        conversation.context.title,
        conversation.lastMessage?.body ?? "",
        ...conversation.participants.map((participant) => participant.fullName),
        ...conversation.participants.map((participant) => participant.email),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, tab, query, unreadOnly, needsReplyOnly]);

  const tabCounts = useMemo(() => {
    const open = items.filter((item) => item.status === "open");
    return {
      all: open.length,
      closed: items.filter((item) => item.status === "closed").length,
    };
  }, [items]);

  const totalUnread = items.reduce((sum, item) => sum + item.unreadCount, 0);
  const totalNeedsReply = items.filter((item) => item.needsReply).length;

  function patchConversation(id: string, patch: Partial<ConversationListRow>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setDetail((current) =>
      current && current.id === id ? { ...current, ...patch } : current,
    );
  }

  async function refreshDetail(id: string) {
    try {
      const response = await fetch(`/api/admin/conversations/${id}`);
      if (!response.ok) return;
      const body = await response.json().catch(() => null);
      if (!body?.data) return;

      const fresh = body.data as ConversationDetailRow;
      setDetail((current) => {
        if (!current || current.id !== id) return current;
        const pending = current.messages.filter((message) =>
          message.id.startsWith("temp-"),
        );
        return { ...fresh, messages: [...fresh.messages, ...pending] };
      });
      void fetch(`/api/admin/conversations/${id}/read`, { method: "POST" });
    } catch {
      // Realtime refresh is best-effort; the next event recovers.
    }
  }

  async function openConversation(id: string) {
    setSelectedId(id);
    setLoadingDetail(true);
    setDetail(null);
    setDraft("");
    setAddingParticipant(false);

    try {
      const response = await fetch(`/api/admin/conversations/${id}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setDetail(body.data as ConversationDetailRow);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
      );
      void fetch(`/api/admin/conversations/${id}/read`, { method: "POST" });
    } catch {
      toast.error("Couldn't open this conversation", {
        description: "The thread could not be loaded. Please try again.",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function sendMessage() {
    if (!detail) return;
    const body = draft.trim();
    if (!body) return;
    const conversationId = detail.id;

    const temp: MessagingMessageRow = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId,
      senderUserId: currentUserId,
      senderName: "You",
      senderRole: "admin",
      body,
      attachmentUrl: null,
      sentAt: new Date().toISOString(),
      isDeleted: false,
    };

    // Clear immediately so the next message can be typed and sent right away.
    setDraft("");
    composerRef.current?.focus();
    setDetail((current) =>
      current
        ? {
            ...current,
            messages: [...current.messages, temp],
            lastMessage: temp,
            needsReply: false,
          }
        : current,
    );

    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error();

      const saved = payload.data as MessagingMessageRow;
      setDetail((current) => {
        if (!current) return current;
        // A realtime refresh may already have pulled the saved copy in.
        const messages = current.messages.some((message) => message.id === saved.id)
          ? current.messages.filter((message) => message.id !== temp.id)
          : current.messages.map((message) =>
              message.id === temp.id ? saved : message,
            );
        return {
          ...current,
          messages,
          lastMessage:
            !current.lastMessage || saved.sentAt >= current.lastMessage.sentAt
              ? saved
              : current.lastMessage,
        };
      });
      setItems((current) =>
        current.map((item) =>
          item.id === conversationId &&
          (!item.lastMessage || saved.sentAt >= item.lastMessage.sentAt)
            ? { ...item, lastMessage: saved, needsReply: false, updatedAt: saved.sentAt }
            : item,
        ),
      );
    } catch {
      setDetail((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((message) => message.id !== temp.id),
              lastMessage: current.lastMessage?.id === temp.id ? null : current.lastMessage,
            }
          : current,
      );
      // Only restore the text if the user has not started another message.
      setDraft((current) => (current.length > 0 ? current : body));
      toast.error("Message not sent", {
        description: "Your message is still in the box. Please try again.",
      });
    }
  }

  async function toggleStatus() {
    if (!detail) return;
    const next = detail.status === "open" ? "closed" : "open";
    const previous = detail.status;
    patchConversation(detail.id, { status: next });

    try {
      const response = await fetch(`/api/admin/conversations/${detail.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error();

      toast.success(next === "closed" ? "Conversation closed" : "Conversation reopened", {
        description:
          next === "closed"
            ? "The thread is now in Closed and no new replies can be sent."
            : "You can reply to this conversation again.",
      });
    } catch {
      patchConversation(detail.id, { status: previous });
      toast.error("Couldn't update this conversation", {
        description: "The thread status did not change. Please try again.",
      });
    }
  }

  async function assignSelf() {
    if (!detail) return;
    const me = detail.participants.find((participant) => participant.userId === currentUserId);
    const previous = detail.assignee;
    const next = { userId: currentUserId, fullName: me?.fullName ?? "You" };
    patchConversation(detail.id, { assignee: next });

    try {
      const response = await fetch(`/api/admin/conversations/${detail.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (!response.ok) throw new Error();

      toast.success("Assigned to you", {
        description: "You're now the owner of this conversation.",
      });
    } catch {
      patchConversation(detail.id, { assignee: previous });
      toast.error("Couldn't assign this conversation", {
        description: "Ownership did not change. Please try again.",
      });
    }
  }

  async function unassign() {
    if (!detail) return;
    const previous = detail.assignee;
    patchConversation(detail.id, { assignee: null });

    try {
      const response = await fetch(`/api/admin/conversations/${detail.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      });
      if (!response.ok) throw new Error();

      toast.success("Conversation unassigned", {
        description: "Any admin can pick this thread up again.",
      });
    } catch {
      patchConversation(detail.id, { assignee: previous });
      toast.error("Couldn't unassign this conversation", {
        description: "Ownership did not change. Please try again.",
      });
    }
  }

  async function addParticipant(candidate: ParticipantCandidateRow) {
    if (!detail) return;
    setCandidates((current) =>
      current.filter((person) => person.userId !== candidate.userId),
    );

    try {
      const response = await fetch(`/api/admin/conversations/${detail.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: candidate.userId }),
      });
      if (!response.ok) throw new Error();

      const participant = {
        userId: candidate.userId,
        fullName: candidate.fullName,
        email: candidate.email,
        phoneNumber: null,
        role: candidate.role,
        lastReadAt: null,
      };
      setDetail((current) =>
        current
          ? { ...current, participants: [...current.participants, participant] }
          : current,
      );
      setItems((current) =>
        current.map((item) =>
          item.id === detail.id
            ? { ...item, participants: [...item.participants, participant] }
            : item,
        ),
      );
      toast.success("Participant added", {
        description: `${candidate.fullName} can now see and reply to this conversation.`,
      });
    } catch {
      toast.error("Couldn't add this person", {
        description: `${candidate.fullName} was not added. Please try again.`,
      });
      setParticipantQuery((value) => value);
    }
  }

  async function removeParticipant(userId: string) {
    if (!detail) return;
    const previousParticipants = detail.participants;
    const nextParticipants = detail.participants.filter(
      (participant) => participant.userId !== userId,
    );
    patchConversation(detail.id, { participants: nextParticipants });

    try {
      const response = await fetch(
        `/api/admin/conversations/${detail.id}/participants/${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();

      toast.success("Participant removed", {
        description: "They no longer have access to this conversation.",
      });
    } catch {
      patchConversation(detail.id, { participants: previousParticipants });
      toast.error("Couldn't remove this person", {
        description: "Their access did not change. Please try again.",
      });
    }
  }

  async function deleteMessage(message: MessagingMessageRow) {
    if (!detail) return;
    setDetail((current) =>
      current
        ? {
            ...current,
            messages: current.messages.map((item) =>
              item.id === message.id ? { ...item, isDeleted: true } : item,
            ),
          }
        : current,
    );

    try {
      const response = await fetch(`/api/admin/messages/${message.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();

      toast.success("Message removed", {
        description: "The message is hidden but kept in the audit trail.",
      });
    } catch {
      setDetail((current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((item) =>
                item.id === message.id ? { ...item, isDeleted: false } : item,
              ),
            }
          : current,
      );
      toast.error("Couldn't remove this message", {
        description: "The message is still visible. Please try again.",
      });
    }
  }

  function openNewMessage() {
    setNewRecipient(null);
    setNewBody("");
    setNewQuery("");
    setNewCandidates([]);
    setNewMessageOpen(true);
  }

  async function startConversation() {
    const recipient = newRecipient;
    const body = newBody.trim();
    if (!recipient || !body) return;

    // Close immediately and clear the form; the request runs in the background.
    setNewMessageOpen(false);
    setNewRecipient(null);
    setNewBody("");
    setNewQuery("");

    try {
      const response = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: recipient.userId, body }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error();

      const conversation = payload.data as ConversationDetailRow;
      const { messages, ...listRow } = conversation;
      void messages;

      setItems((current) => [
        listRow,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setSelectedId(conversation.id);
      setDetail(conversation);
      toast.success(`Conversation started with ${recipient.fullName}`, {
        description: "Your message is in the thread below.",
      });
    } catch {
      setNewRecipient(recipient);
      setNewBody(body);
      setNewMessageOpen(true);
      toast.error("Could not start this conversation", {
        description: "Your message was not sent. Please try again.",
      });
    }
  }

  const assignedToMe = detail?.assignee?.userId === currentUserId;

  return (
    <div>
      <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-col gap-2 border-b border-ink/[0.07] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button size="sm" variant="secondary" onClick={openNewMessage}>
              <Plus className="h-3 w-3" strokeWidth={2} />
              New message
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <TabFilters
                ariaLabel="Conversation context"
                value={tab}
                onChange={(value) => setTab(value)}
                options={[
                  { id: "all", label: "All", count: tabCounts.all },
                  { id: "closed", label: "Closed", count: tabCounts.closed },
                ]}
              />
              <SearchInput
                value={query}
                onValueChange={setQuery}
                showIcon={false}
                label="Search conversations"
                placeholder="Person, code, message"
                className="w-56"
              />
            </div>
          </div>

          <SecondaryTabFilters
            ariaLabel="Conversation filters"
            value={unreadOnly ? "unread" : needsReplyOnly ? "reply" : "all"}
            onChange={(value) => {
              setUnreadOnly(value === "unread");
              setNeedsReplyOnly(value === "reply");
            }}
            options={[
              { id: "all", label: "All threads" },
              { id: "unread", label: "Unread", count: totalUnread },
              { id: "reply", label: "Needs reply", count: totalNeedsReply },
            ]}
          />
        </div>

            <div className="grid min-h-[560px] lg:h-[calc(100dvh-20rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_290px]">
              <div className="group flex max-h-[340px] min-h-0 flex-col border-b border-ink/[0.07] lg:max-h-none lg:border-b-0 lg:border-r">
                <ScrollArea className="min-h-0 flex-1">
                  {filtered.length === 0 ? (
                    <SearchEmpty
                      compact
                      icon={Inbox}
                      title="No conversations match"
                      description="Try another person, code, or filter."
                      onClear={
                        query || tab !== "all" || unreadOnly || needsReplyOnly
                          ? () => {
                              setQuery("");
                              setTab("all");
                              setUnreadOnly(false);
                              setNeedsReplyOnly(false);
                            }
                          : undefined
                      }
                      clearLabel="Clear filters"
                    />
                  ) : (
                    <ul className="divide-y divide-ink/[0.05]">
                      {filtered.map((conversation) => {
                        const Icon = contextIcon(conversation.contextType);
                        const active = conversation.id === selectedId;
                        return (
                          <li key={conversation.id}>
                            <button
                              type="button"
                              onClick={() => void openConversation(conversation.id)}
                              aria-current={active ? "true" : undefined}
                              className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                                active ? "bg-ink/[0.035]" : "hover:bg-ink/[0.02]"
                              }`}
                            >
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink/[0.07] bg-ink/[0.02] text-ink/40">
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="truncate text-[0.75rem] font-semibold text-ink/80">
                                    {conversationTitle(conversation)}
                                  </span>
                                  <span className="shrink-0 text-[0.5625rem] text-ink/35">
                                    {relativeTime(
                                      conversation.lastMessage?.sentAt ??
                                        conversation.updatedAt,
                                    )}
                                  </span>
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5">
                                  {conversation.context.code && (
                                    <span className="font-mono text-[0.5625rem] font-semibold tracking-wide text-ink/40">
                                      {conversation.context.code}
                                    </span>
                                  )}
                                  {conversation.needsReply && (
                                    <span className="rounded-full bg-[#c99a4e]/15 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-[#7a5212]">
                                      Reply
                                    </span>
                                  )}
                                  {conversation.unreadCount > 0 && (
                                    <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 font-mono text-[0.5rem] font-semibold text-white">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </span>
                                <span className="mt-1 block truncate text-[0.6875rem] text-ink/45">
                                  {conversation.lastMessage
                                    ? `${conversation.lastMessage.senderName.split(" ")[0]}: ${conversation.lastMessage.body}`
                                    : "No messages yet"}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </div>

              <div className="flex min-h-0 flex-col">
                {!selectedId ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.04] text-ink/30">
                      <MessageSquare className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <p className="mt-3 text-[0.875rem] font-semibold text-ink/70">
                      Select a conversation
                    </p>
                    <p className="mt-1 max-w-[36ch] text-[0.75rem] leading-[1.6] text-ink/45">
                      Choose a thread to read the history, see the linked record, and
                      reply.
                    </p>
                  </div>
                ) : loadingDetail && !detail ? (
                  <div className="flex-1 space-y-3 p-4" aria-hidden="true">
                    <div className="h-10 w-2/3 animate-pulse rounded-lg bg-ink/[0.05]" />
                    <div className="h-16 w-3/4 animate-pulse rounded-xl bg-ink/[0.04]" />
                    <div className="ml-auto h-12 w-1/2 animate-pulse rounded-xl bg-ink/[0.04]" />
                    <div className="h-20 w-2/3 animate-pulse rounded-xl bg-ink/[0.04]" />
                  </div>
                ) : detail ? (
                  <>
                    <div className="border-b border-ink/[0.07] px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-[0.875rem] font-semibold text-ink">
                              {conversationTitle(detail)}
                            </h2>
                            <Badge
                              tone={detail.status === "open" ? "success" : "neutral"}
                              surface="light"
                            >
                              {detail.status === "open" ? "Open" : "Closed"}
                            </Badge>
                            {detail.assignee && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.04] px-2 py-0.5 text-[0.5625rem] font-medium text-ink/55">
                                <UserCheck className="h-3 w-3" strokeWidth={2} />
                                {detail.assignee.fullName}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] text-ink/45">
                            {detail.context.code && (
                              <span className="font-mono text-[0.625rem] font-semibold text-ink/55">
                                {detail.context.code}
                              </span>
                            )}
                            <span>{detail.context.title}</span>
                            {detail.context.subtitle && (
                              <span className="text-ink/35">· {detail.context.subtitle}</span>
                            )}
                            {detail.context.href && (
                              <Link
                                href={detail.context.href}
                                className="font-medium text-clay underline-offset-2 hover:underline"
                              >
                                View record
                              </Link>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => void assignSelf()}
                            disabled={assignedToMe}
                          >
                            <UserCheck className="h-3 w-3" strokeWidth={2} />
                            {assignedToMe ? "Assigned to you" : "Assign to me"}
                          </Button>
                          {detail.assignee && !assignedToMe && (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => void unassign()}
                            >
                              <UserX className="h-3 w-3" strokeWidth={2} />
                              Unassign
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant={detail.status === "closed" ? "secondary" : "ghost"}
                            onClick={() => setStatusConfirmOpen(true)}
                          >
                            {detail.status === "closed" ? (
                              <RotateCcw className="h-3 w-3" strokeWidth={2} />
                            ) : (
                              <Lock className="h-3 w-3" strokeWidth={2} />
                            )}
                            {detail.status === "closed" ? "Reopen" : "Close"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="group min-h-0 flex-1 px-4 py-4">
                      {detail.messages.length === 0 ? (
                        <p className="text-center text-[0.75rem] text-ink/35">
                          No messages in this conversation yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {detail.messages.map((message, index) => {
                            const previous = detail.messages[index - 1];
                            const showDay =
                              !previous ||
                              dayKey(previous.sentAt) !== dayKey(message.sentAt);
                            const mine = message.senderUserId === currentUserId;
                            return (
                              <div key={message.id}>
                                {showDay && (
                                  <div className="mb-3 flex items-center gap-3">
                                    <span className="h-px flex-1 bg-ink/[0.06]" />
                                    <span className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/30">
                                      {dayKey(message.sentAt)}
                                    </span>
                                    <span className="h-px flex-1 bg-ink/[0.06]" />
                                  </div>
                                )}
                                <div
                                  className={`group/msg flex items-end gap-2 ${
                                    mine ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  {!mine && (
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.5rem] font-semibold text-ink/50">
                                      {initials(message.senderName)}
                                    </span>
                                  )}
                                  <div
                                    className={`max-w-[80%] ${
                                      mine ? "items-end" : "items-start"
                                    }`}
                                  >
                                    <div
                                      className={`rounded-xl px-3 py-2 text-[0.75rem] leading-[1.55] ${
                                        message.isDeleted
                                          ? "border border-dashed border-ink/15 bg-ink/[0.015] italic text-ink/35"
                                          : mine
                                            ? "bg-ink text-paper"
                                            : "border border-ink/[0.07] bg-[#fafaf9] text-ink/75"
                                      }`}
                                    >
                                      {message.isDeleted ? "Message removed" : message.body}
                                    </div>
                                    <p
                                      className={`mt-1 flex items-center gap-1.5 text-[0.5625rem] text-ink/30 ${
                                        mine ? "justify-end" : ""
                                      }`}
                                    >
                                      <span>{mine ? "You" : message.senderName}</span>
                                      <span>·</span>
                                      <span>{roleLabel(message.senderRole)}</span>
                                      <span>·</span>
                                      <span>{TIME.format(new Date(message.sentAt))}</span>
                                      {!message.isDeleted && (
                                        <button
                                          type="button"
                                          aria-label="Remove message"
                                          onClick={() => setMessageToDelete(message)}
                                          className="ml-1 rounded p-0.5 text-ink/25 opacity-0 transition-opacity hover:bg-ink/[0.05] hover:text-[#991b1b] focus-visible:opacity-100 group-hover/msg:opacity-100"
                                        >
                                          <Trash2 className="h-3 w-3" strokeWidth={2} />
                                        </button>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    <div className="border-t border-ink/[0.07] p-3">
                      {detail.status === "closed" ? (
                        <p className="rounded-lg bg-ink/[0.02] px-3 py-2.5 text-center text-[0.6875rem] text-ink/40">
                          This conversation is closed. Reopen it to reply.
                        </p>
                      ) : (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void sendMessage();
                          }}
                          className="flex items-end gap-2"
                        >
                          <Textarea
                            ref={composerRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void sendMessage();
                              }
                            }}
                            rows={2}
                            maxLength={5000}
                            placeholder="Write a reply…  Enter to send, Shift+Enter for a new line"
                            className="min-h-[2.5rem] flex-1"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={draft.trim().length === 0}
                          >
                            <Send className="h-3 w-3" strokeWidth={2} />
                            Send
                          </Button>
                        </form>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <aside className="hidden min-h-0 flex-col border-l border-ink/[0.07] xl:flex">
                {detail ? (
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-3">
                      <section>
                        <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                          Linked record
                        </p>
                        <div className="mt-1.5 rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[0.6875rem] font-semibold text-ink/75">
                              {detail.context.title}
                            </span>
                            {detail.context.code && (
                              <span className="font-mono text-[0.5625rem] font-semibold text-ink/40">
                                {detail.context.code}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[0.625rem] capitalize text-ink/45">
                            {detail.context.subtitle ?? "No linked details"}
                          </p>
                          {detail.context.href && (
                            <Link
                              href={detail.context.href}
                              className="mt-2 inline-flex text-[0.625rem] font-medium text-clay underline-offset-2 hover:underline"
                            >
                              Open record
                            </Link>
                          )}
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                            Participants ({detail.participants.length})
                          </p>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              setAddingParticipant((value) => !value);
                              setParticipantQuery("");
                            }}
                            aria-expanded={addingParticipant}
                          >
                            {addingParticipant ? (
                              <X className="h-3 w-3" strokeWidth={2} />
                            ) : (
                              <Plus className="h-3 w-3" strokeWidth={2} />
                            )}
                            {addingParticipant ? "Cancel" : "Add"}
                          </Button>
                        </div>

                        {addingParticipant && (
                          <div className="mt-2 rounded-lg border border-ink/[0.08] bg-white p-2">
                            <SearchInput
                              value={participantQuery}
                              onValueChange={setParticipantQuery}
                              showIcon={false}
                              label="Search people"
                              placeholder="Name or email"
                              className="w-full"
                            />
                            <ScrollArea className="mt-1.5 max-h-44">
                              {searchingPeople ? (
                                <p className="px-1 py-2 text-[0.625rem] text-ink/35">
                                  Searching…
                                </p>
                              ) : candidates.length === 0 ? (
                                <p className="px-1 py-2 text-[0.625rem] text-ink/35">
                                  No one matches this search.
                                </p>
                              ) : (
                                <ul className="space-y-0.5">
                                  {candidates.map((candidate) => (
                                    <li key={candidate.userId}>
                                      <button
                                        type="button"
                                        onClick={() => void addParticipant(candidate)}
                                        className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-ink/[0.03]"
                                      >
                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.5rem] font-semibold text-ink/50">
                                          {initials(candidate.fullName)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                          <span className="block truncate text-[0.6875rem] font-medium text-ink/75">
                                            {candidate.fullName}
                                          </span>
                                          <span className="block truncate text-[0.5625rem] text-ink/40">
                                            {roleLabel(candidate.role)} · {candidate.email}
                                          </span>
                                        </span>
                                        <UserPlus
                                          className="h-3 w-3 shrink-0 text-ink/35"
                                          strokeWidth={2}
                                        />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </ScrollArea>
                          </div>
                        )}

                        <ul className="mt-2 space-y-1.5">
                          {detail.participants.map((participant) => (
                            <li
                              key={participant.userId}
                              className="group/person flex items-center gap-2 rounded-lg border border-ink/[0.06] px-2 py-1.5"
                            >
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.5rem] font-semibold text-ink/50">
                                {initials(participant.fullName)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.6875rem] font-medium text-ink/75">
                                  {participant.fullName}
                                  {participant.userId === currentUserId && (
                                    <span className="ml-1 text-ink/35">(you)</span>
                                  )}
                                </span>
                                <span className="block truncate text-[0.5625rem] text-ink/40">
                                  {roleLabel(participant.role)} · {participant.email}
                                </span>
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${participant.fullName}`}
                                onClick={() =>
                                  setParticipantToRemove({
                                    userId: participant.userId,
                                    fullName: participant.fullName,
                                  })
                                }
                                className="rounded p-0.5 text-ink/25 opacity-0 transition-opacity hover:bg-ink/[0.05] hover:text-[#991b1b] focus-visible:opacity-100 group-hover/person:opacity-100"
                              >
                                <X className="h-3 w-3" strokeWidth={2} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                          Details
                        </p>
                        <dl className="mt-1.5 space-y-1 text-[0.625rem]">
                          <div className="flex justify-between gap-2">
                            <dt className="text-ink/40">Opened</dt>
                            <dd className="text-ink/65">{DAY.format(new Date(detail.createdAt))}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-ink/40">Messages</dt>
                            <dd className="text-ink/65">{detail.messageCount}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-ink/40">Assignee</dt>
                            <dd className="truncate text-ink/65">
                              {detail.assignee?.fullName ?? "Unassigned"}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-ink/40">Context</dt>
                            <dd className="text-ink/65 capitalize">
                              {detail.contextType.replaceAll("_", " ")}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-4 text-center text-[0.6875rem] text-ink/35">
                    Thread details appear here.
                  </div>
                )}
              </aside>
            </div>
      </section>

      {newMessageOpen && (
        <OverlayCard
          onClose={() => setNewMessageOpen(false)}
          labelledBy="new-message-title"
          eyebrow="Messaging"
          title="New message"
          titleClassName="text-[0.9375rem] font-semibold text-ink"
          panelClassName="max-w-lg"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setNewMessageOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void startConversation()}
                disabled={!newRecipient || newBody.trim().length === 0}
              >
                <Send className="h-3 w-3" strokeWidth={2} />
                Send message
              </Button>
            </>
          }
        >
          <div className="space-y-3 p-4">
            {newRecipient ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-ink/[0.08] bg-ink/[0.015] p-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clay/15 text-[0.5625rem] font-semibold text-clay">
                    {initials(newRecipient.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.75rem] font-semibold text-ink/80">
                      {newRecipient.fullName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[0.625rem] text-ink/45">
                      <Badge
                        tone={roleTone(newRecipient.role)}
                        surface="light"
                        className="px-1.5 py-0 text-[0.5625rem]"
                      >
                        {roleLabel(newRecipient.role)}
                      </Badge>
                      <span className="truncate">{newRecipient.email}</span>
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setNewRecipient(null)}
                  >
                    Change
                  </Button>
                </div>

                <Textarea
                  autoFocus
                  value={newBody}
                  onChange={(event) => setNewBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void startConversation();
                    }
                  }}
                  rows={4}
                  maxLength={5000}
                  placeholder={`Write your first message to ${newRecipient.fullName}…`}
                />
              </>
            ) : (
              <>
                <SearchInput
                  value={newQuery}
                  onValueChange={setNewQuery}
                  showIcon={false}
                  label="Search people"
                  placeholder="Search by name or email"
                  className="w-full"
                />
                <ScrollArea className="max-h-64">
                  {searchingNew ? (
                    <p className="px-1 py-2 text-[0.6875rem] text-ink/35">
                      Searching…
                    </p>
                  ) : newCandidates.length === 0 ? (
                    <p className="px-1 py-2 text-[0.6875rem] text-ink/35">
                      No one matches this search.
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {newCandidates.map((candidate) => (
                        <li key={candidate.userId}>
                          <button
                            type="button"
                            onClick={() => setNewRecipient(candidate)}
                            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-ink/[0.03]"
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.5rem] font-semibold text-ink/50">
                              {initials(candidate.fullName)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.75rem] font-medium text-ink/75">
                                {candidate.fullName}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5">
                                <Badge
                                  tone={roleTone(candidate.role)}
                                  surface="light"
                                  className="px-1.5 py-0 text-[0.5625rem]"
                                >
                                  {roleLabel(candidate.role)}
                                </Badge>
                                <span className="truncate text-[0.625rem] text-ink/40">
                                  {candidate.email}
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        </OverlayCard>
      )}

      <ConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        tone={detail?.status === "open" ? "danger" : "success"}
        title={
          detail?.status === "open" ? "Close this conversation?" : "Reopen this conversation?"
        }
        description={
          detail?.status === "open"
            ? "The thread moves to Closed and the composer is disabled until it is reopened. The message history is kept."
            : "The thread returns to the open inbox and you can reply again."
        }
        confirmLabel={detail?.status === "open" ? "Close conversation" : "Reopen conversation"}
        onConfirm={() => void toggleStatus()}
      />

      <ConfirmDialog
        open={messageToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMessageToDelete(null);
        }}
        tone="danger"
        title="Remove this message?"
        description="The message is hidden from the thread but kept in the audit trail. This cannot be undone from the console."
        confirmLabel="Remove message"
        onConfirm={() => {
          if (messageToDelete) void deleteMessage(messageToDelete);
          setMessageToDelete(null);
        }}
      />

      <ConfirmDialog
        open={participantToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setParticipantToRemove(null);
        }}
        tone="danger"
        title="Remove this participant?"
        description={
          participantToRemove
            ? `${participantToRemove.fullName} will no longer see or reply to this conversation.`
            : undefined
        }
        confirmLabel="Remove participant"
        onConfirm={() => {
          if (participantToRemove) void removeParticipant(participantToRemove.userId);
          setParticipantToRemove(null);
        }}
      />
    </div>
  );
}
