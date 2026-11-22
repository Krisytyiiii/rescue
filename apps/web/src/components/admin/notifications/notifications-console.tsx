"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast";
import type { MessagingNotificationRow } from "@furescue/core";

const PAGE_SIZE = 10;

const DAY = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const ATTENTION_TYPES = new Set([
  "adoption_status",
  "report_status",
  "rescue_assignment",
]);

const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  report_status: "Report status",
  rescue_assignment: "Rescue assignment",
  adoption_status: "Adoption status",
  new_message: "New message",
  vaccination_due: "Vaccination due",
  announcement: "Announcement",
  system: "System",
};

function notificationTone(type: string) {
  switch (type) {
    case "report_status":
      return "warning" as const;
    case "rescue_assignment":
      return "info" as const;
    case "adoption_status":
      return "success" as const;
    case "new_message":
      return "progress" as const;
    case "vaccination_due":
      return "pending" as const;
    case "announcement":
      return "warning" as const;
    case "system":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

function relativeTime(value: string): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24 && date.getDate() === new Date().getDate()) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return DAY.format(date);
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isYesterday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function dayGroup(value: string): string {
  if (isToday(value)) return "Today";
  if (isYesterday(value)) return "Yesterday";
  return DAY.format(new Date(value));
}

function notificationHref(notification: MessagingNotificationRow): string | null {
  if (!notification.referenceId) return null;
  switch (notification.referenceType) {
    case "conversation":
      return `/admin/messaging?conversation=${notification.referenceId}`;
    case "adoption_request":
      return "/admin/adoptions";
    case "report":
      return "/admin/reports";
    case "rescue":
      return "/admin/rescues";
    case "animal":
      return "/admin/animals";
    case "user":
      return "/admin/users";
    default:
      return null;
  }
}

function referenceLabel(type: string | null): string {
  switch (type) {
    case "conversation":
      return "Open conversation";
    case "adoption_request":
      return "Open adoption request";
    case "report":
      return "Open reports";
    case "rescue":
      return "Open rescues";
    case "animal":
      return "Open animals";
    case "user":
      return "Open users";
    default:
      return "Open record";
  }
}

interface NotificationsConsoleProps {
  notifications: MessagingNotificationRow[];
}

export function NotificationsConsole({ notifications }: NotificationsConsoleProps) {
  const toast = useToast();
  const [items, setItems] = useState(notifications);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(false);
  const seenIds = useRef(new Set(notifications.map((item) => item.id)));

  // Server props refresh on the realtime broadcast; keep the list in sync and
  // call out rows that arrived while the page was already open.
  useEffect(() => {
    const incoming = notifications.filter(
      (notification) =>
        !notification.isRead && !seenIds.current.has(notification.id),
    );
    seenIds.current = new Set(notifications.map((item) => item.id));
    setItems(notifications);

    if (incoming.length === 0) return;
    setNewIds((current) => {
      const next = new Set(current);
      for (const notification of incoming) next.add(notification.id);
      return next;
    });
    setLive(true);
    toast.info(
      incoming.length === 1 ? "New notification" : `${incoming.length} new notifications`,
      { description: "Your inbox has been updated." },
    );
  }, [notifications]);

  const unread = items.filter((notification) => !notification.isRead).length;
  const attention = items.filter(
    (notification) => !notification.isRead && ATTENTION_TYPES.has(notification.type),
  ).length;
  const today = items.filter((notification) => isToday(notification.sentAt)).length;

  useEffect(() => {
    if (!live) return;
    const timer = window.setTimeout(() => setLive(false), 4000);
    return () => window.clearTimeout(timer);
  }, [live]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((notification) =>
      [notification.title, notification.body]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const grouped = useMemo(() => {
    const groups: { label: string; rows: MessagingNotificationRow[] }[] = [];
    for (const notification of paginated) {
      const label = dayGroup(notification.sentAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.rows.push(notification);
      else groups.push({ label, rows: [notification] });
    }
    return groups;
  }, [paginated]);

  async function toggleRead(notification: MessagingNotificationRow) {
    const next = !notification.isRead;
    setItems((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, isRead: next, readAt: next ? new Date().toISOString() : null }
          : item,
      ),
    );
    if (next) {
      setNewIds((current) => {
        const updated = new Set(current);
        updated.delete(notification.id);
        return updated;
      });
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notification.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: next }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: notification.isRead, readAt: notification.readAt }
            : item,
        ),
      );
      toast.error("Couldn't update this notification", {
        description: "Its read state did not change. Please try again.",
      });
    }
  }

  async function markAllRead() {
    if (unread === 0) return;
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.isRead
          ? item
          : { ...item, isRead: true, readAt: new Date().toISOString() },
      ),
    );
    setNewIds(new Set());

    try {
      const response = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      });
      if (!response.ok) throw new Error();
      toast.success("All notifications read", {
        description: "Your inbox is clear for now.",
      });
    } catch {
      setItems(previous);
      toast.error("Couldn't mark everything read", {
        description: "Your unread notifications are unchanged. Please try again.",
      });
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Unread" value={unread} tone="clay" />
        <Kpi label="Needs attention" value={attention} tone="warning" />
        <Kpi label="Today" value={today} tone="ink" />
        <Kpi label="Total" value={items.length} tone="ink" />
      </div>

      <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-col gap-2 border-b border-ink/[0.07] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-ink/[0.07] bg-ink/[0.02] text-ink/40">
                <BellRing className="h-3.5 w-3.5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-ink/75">
                  Your notifications
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.5625rem] font-medium ${
                      live ? "bg-moss/10 text-moss" : "bg-ink/[0.04] text-ink/40"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        live ? "animate-pulse bg-moss" : "bg-ink/25"
                      }`}
                    />
                    {live ? "Live" : "Idle"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void markAllRead()}
                disabled={unread === 0}
              >
                <CheckCheck className="h-3 w-3" strokeWidth={2} />
                Mark all read
              </Button>
              <SearchInput
                value={query}
                onValueChange={setQuery}
                showIcon={false}
                label="Search notifications"
                placeholder="Title or body"
                className="w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <SearchEmpty
            icon={Bell}
            title="You're all caught up"
            description="No notifications match the current search."
            onClear={query ? () => setQuery("") : undefined}
            clearLabel="Clear search"
          />
        ) : (
          <ScrollArea className="max-h-[calc(100dvh-16rem)]">
            <ul className="divide-y divide-ink/[0.05]">
              {grouped.map((group) => (
                <li key={group.label} className="list-none">
                  <p className="sticky top-0 z-10 border-b border-ink/[0.06] bg-white/95 px-4 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/40 backdrop-blur">
                    {group.label}
                  </p>
                  <ul className="divide-y divide-ink/[0.05]">
                    {group.rows.map((notification) => {
                      const href = notificationHref(notification);
                      return (
                        <li
                          key={notification.id}
                          className={`flex items-start gap-3 px-4 py-3 ${
                            notification.isRead ? "" : "bg-clay/[0.025]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                              notification.isRead
                                ? "bg-ink/[0.03] text-ink/30"
                                : "bg-clay/10 text-clay"
                            }`}
                          >
                            {notification.isRead ? (
                              <Bell className="h-3.5 w-3.5" strokeWidth={1.9} />
                            ) : (
                              <BellRing className="h-3.5 w-3.5" strokeWidth={1.9} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[0.75rem] font-semibold text-ink/80">
                                {notification.title}
                              </span>
                              <Badge
                                tone={notificationTone(notification.type)}
                                surface="light"
                              >
                                {NOTIFICATION_TYPE_LABEL[notification.type] ??
                                  notification.type}
                              </Badge>
                              {newIds.has(notification.id) && !notification.isRead && (
                                <Badge tone="pending" surface="light">
                                  New
                                </Badge>
                              )}
                              <span className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink/35">
                                {notification.channel.replaceAll("_", " ")}
                              </span>
                              <span className="ml-auto text-[0.5625rem] text-ink/35">
                                {relativeTime(notification.sentAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[0.6875rem] leading-[1.55] text-ink/55">
                              {notification.body}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.5625rem] text-ink/40">
                              {href ? (
                                <Link
                                  href={href}
                                  className="font-medium text-clay underline-offset-2 hover:underline"
                                >
                                  {referenceLabel(notification.referenceType)}
                                </Link>
                              ) : (
                                <span>No linked record</span>
                              )}
                            </p>
                          </div>
                          <Button
                            size="xs"
                            variant={notification.isRead ? "ghost" : "secondary"}
                            onClick={() => void toggleRead(notification)}
                          >
                            {notification.isRead ? "Mark unread" : "Mark read"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          itemLabel="notifications"
          onPageChange={setPage}
          className="border-t border-ink/[0.07] px-4 py-2.5"
        />
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "clay" | "warning" | "ink";
}) {
  const toneClass =
    tone === "clay"
      ? "text-clay"
      : tone === "warning"
        ? "text-[#a04a35]"
        : "text-ink";
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/40">
        {label}
      </p>
      <p className={`mt-0.5 text-[1.125rem] font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
