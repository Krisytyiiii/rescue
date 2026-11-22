"use client";

import {
  Activity,
  Clock,
  Download,
  Lock,
  RefreshCw,
  SearchX,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverlayCard } from "@/components/ui/overlay-card";
import { Pagination } from "@/components/ui/pagination";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { SecondaryTabFilters } from "@/components/ui/secondary-tab-filters";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/user-avatar";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  AUDIT_DOMAIN_OPTIONS,
  AUDIT_TONE_BADGE,
  TONE_CLASS,
  auditActionMeta,
  entityLabel,
  recordHref,
} from "./audit-meta";
import { AuditDetail } from "./audit-detail";

import type {
  AuditDomain,
  AuditEntryRow,
  AuditListResult,
  AuditLogDetail,
  AuditRange,
} from "@furescue/core";

const RANGE_OPTIONS: Array<{ value: AuditRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export interface AuditFilters {
  range: AuditRange;
  domain: AuditDomain;
  actor: string;
  action: string;
  q: string;
  entityType: string;
  entityId: string;
  page: number;
}

const TIME = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });
const DAY = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });

function relativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return DAY.format(new Date(value));
}

function buildParams(filters: AuditFilters, patch: Partial<AuditFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.range !== "7d") params.set("range", next.range);
  if (next.domain !== "all") params.set("domain", next.domain);
  if (next.actor) params.set("actor", next.actor);
  if (next.action) params.set("action", next.action);
  if (next.q) params.set("q", next.q);
  if (next.entityType) params.set("entityType", next.entityType);
  if (next.entityId) params.set("entityId", next.entityId);
  if (next.page > 1) params.set("page", String(next.page));
  return params.toString();
}

export function AuditConsole({
  data,
  filters,
}: {
  data: AuditListResult;
  filters: AuditFilters;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const lastQuery = useRef(filters.q);

  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [newEvents, setNewEvents] = useState(0);

  // Audit inserts arrive on the shared admin-realtime topic. Coalesce bursts
  // into one pill instead of silently refreshing the ledger under the reader.
  useEffect(() => {
    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      return;
    }

    let timer: number | null = null;
    const channel = client
      .channel("admin-realtime")
      .on("broadcast", { event: "change" }, (message) => {
        const table = (message.payload as { table?: string } | undefined)?.table;
        if (table !== "audit_logs") return;
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          timer = null;
          setNewEvents((count) => count + 1);
        }, 250);
      })
      .subscribe();

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      void client.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setQuery(filters.q);
    lastQuery.current = filters.q;
  }, [filters.q]);

  useEffect(() => {
    if (query === lastQuery.current) return;
    const timer = window.setTimeout(() => {
      lastQuery.current = query;
      startTransition(() => apply({ q: query, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function apply(patch: Partial<AuditFilters>) {
    const params = buildParams(filters, patch);
    startTransition(() => {
      router.push(`/admin/audit${params ? `?${params}` : ""}`);
    });
  }

  function clearFilters() {
    setQuery("");
    lastQuery.current = "";
    startTransition(() => {
      router.push("/admin/audit");
    });
  }

  function refreshNewEvents() {
    setNewEvents(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      router.refresh();
    });
  }

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.summary.total };
    for (const option of data.facets.actions) {
      const domain = auditActionMeta(option.value).domain;
      counts[domain] = (counts[domain] ?? 0) + option.count;
    }
    return counts;
  }, [data.facets.actions, data.summary.total]);

  const actionOptions = useMemo(
    () => [
      { value: "", label: "All actions" },
      ...data.facets.actions.map((option) => ({
        value: option.value,
        label: `${auditActionMeta(option.value).label} (${option.count})`,
      })),
    ],
    [data.facets.actions],
  );

  const actorOptions = useMemo(
    () => [
      { value: "", label: "All actors" },
      ...data.facets.actors.map((option) => ({
        value: option.value,
        label: `${option.label} (${option.count})`,
      })),
    ],
    [data.facets.actors],
  );

  const hasFilters =
    filters.domain !== "all" ||
    Boolean(filters.actor) ||
    Boolean(filters.action) ||
    Boolean(filters.q) ||
    Boolean(filters.entityType) ||
    filters.range !== "7d";

  async function openDetail(row: AuditEntryRow) {
    setDetailId(row.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/audit/${row.id}`);
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) throw new Error();
      setDetail(body.data as AuditLogDetail);
    } catch {
      setDetailId(null);
      toast.error("Couldn't open this entry", {
        description: "The audit detail could not be loaded. Please try again.",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function viewHistory(recordType: string, recordId: string) {
    setDetailId(null);
    setDetail(null);
    apply({ entityType: recordType, entityId: recordId, page: 1 });
  }

  const exportHref = `/api/admin/audit/export?${buildParams(filters, { page: 1 })}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-clay">
            Insights
          </p>
          <h1 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.4rem)] leading-[1.04] tracking-[-0.03em] text-ink">
            Audit logs
          </h1>
          <p className="mt-1 max-w-[68ch] text-[0.8125rem] leading-[1.6] text-ink/55">
            Every administrative action, who performed it, and what changed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {newEvents > 0 && (
            <button
              type="button"
              onClick={refreshNewEvents}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-moss/25 bg-moss/[0.08] px-3 text-[0.75rem] font-medium text-[#1c5f42] transition-colors hover:border-moss/40 hover:bg-moss/[0.14]"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" />
              {newEvents} new event{newEvents === 1 ? "" : "s"}
              <RefreshCw className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 text-[0.6875rem] font-medium text-ink/50">
            <Lock className="h-3 w-3 text-ink/35" strokeWidth={1.9} />
            Append-only
          </span>
          <a
            href={exportHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 text-[0.75rem] font-medium text-ink/65 transition-colors hover:border-ink/25 hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          label="Events"
          value={data.summary.total}
          hint="Matching the current filters"
          icon={Activity}
          tone="clay"
        />
        <StatCard
          label="Admins active"
          value={data.summary.activeActors}
          hint="Distinct people who acted"
          icon={Users}
          tone="moss"
        />
        <StatCard
          label="Sensitive changes"
          value={data.summary.sensitive}
          hint="Rejections, cancels, deletes"
          icon={ShieldAlert}
          tone="amber"
        />
        <StatCard
          label="Last activity"
          value={data.summary.lastActivity ? relativeTime(data.summary.lastActivity) : "—"}
          hint={data.summary.lastActivity ? DAY.format(new Date(data.summary.lastActivity)) : "No events in range"}
          icon={Clock}
          tone="forest"
        />
      </div>

      <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-col gap-2 border-b border-ink/[0.07] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Select
                name="audit-range"
                value={filters.range}
                onChange={(value) => apply({ range: value as AuditRange, page: 1 })}
                options={RANGE_OPTIONS}
                size="compact"
              />
            </div>
            <div className="w-44">
              <Select
                name="audit-actor"
                value={filters.actor}
                onChange={(value) => apply({ actor: value, page: 1 })}
                options={actorOptions}
                size="compact"
              />
            </div>
            <div className="w-52">
              <Select
                name="audit-action"
                value={filters.action}
                onChange={(value) => apply({ action: value, page: 1 })}
                options={actionOptions}
                size="compact"
              />
            </div>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search code, record, or person"
              label="Search audit logs"
              className="w-full sm:w-64"
            />
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <span className="ml-auto text-[0.6875rem] text-ink/40">
              {pending ? "Updating…" : `${data.meta.total} events`}
            </span>
          </div>

          <SecondaryTabFilters
            ariaLabel="Audit domain"
            value={filters.domain}
            onChange={(value) => apply({ domain: value as AuditDomain, page: 1 })}
            wrap
            options={AUDIT_DOMAIN_OPTIONS.map((option) => ({
              id: option.id,
              label: option.label,
              count: domainCounts[option.id] ?? 0,
            }))}
          />

          {(filters.entityType || filters.entityId) && (
            <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-ink/50">
              <span>
                Showing history for {entityLabel(filters.entityType)} ·{" "}
                <span className="font-mono text-ink/65">{filters.entityId.slice(0, 8)}</span>
              </span>
              <button
                type="button"
                onClick={() => apply({ entityType: "", entityId: "", page: 1 })}
                className="font-medium text-clay hover:underline"
              >
                Remove record filter
              </button>
            </div>
          )}
        </div>

        {pending ? (
          <AuditTableSkeleton rows={data.meta.pageSize} />
        ) : data.items.length === 0 ? (
          <SearchEmpty
            icon={SearchX}
            title={hasFilters ? "No events match these filters" : "No audit activity in this period"}
            description={
              hasFilters
                ? "Try another person, action, or date range."
                : "Widen the date range to see earlier actions."
            }
            onClear={hasFilters ? clearFilters : undefined}
            clearLabel="Clear filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[0.75rem]">
              <thead className="bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Actor</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                  <th className="px-3 py-2 font-semibold">Record</th>
                  <th className="px-3 py-2 font-semibold">Change</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {data.items.map((row) => {
                  const meta = auditActionMeta(row.action);
                  const Icon = meta.icon;
                  const tone = TONE_CLASS[meta.tone];
                  return (
                    <tr
                      key={row.id}
                      onClick={() => void openDetail(row)}
                      className="cursor-pointer transition-colors hover:bg-ink/[0.02]"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-ink/55">
                        <span className="block tabular-nums text-ink/70">
                          {TIME.format(new Date(row.createdAt))}
                        </span>
                        <span className="text-[0.625rem] text-ink/35">
                          {DAY.format(new Date(row.createdAt))} · {relativeTime(row.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={row.actor?.profilePhotoUrl}
                            className="h-6 w-6"
                            iconClassName="h-3 w-3"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink/75">
                              {row.actor?.fullName ?? "System"}
                            </p>
                            <p className="truncate text-[0.625rem] capitalize text-ink/40">
                              {row.actor?.role.replaceAll("_", " ") ?? "automated"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${tone.wash} ${tone.icon}`}>
                            <Icon className="h-3 w-3" strokeWidth={2} />
                          </span>
                          <span className="font-medium text-ink/75">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {row.record ? (
                          <div className="min-w-0">
                            <Link
                              href={recordHref(row.record)}
                              onClick={(event) => event.stopPropagation()}
                              className="block truncate font-mono text-[0.6875rem] font-semibold text-clay hover:underline"
                            >
                              {row.record.code ?? row.record.title}
                            </Link>
                            <p className="truncate text-[0.625rem] text-ink/40">
                              {entityLabel(row.entityType)} · {row.record.title}
                            </p>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-[0.6875rem] text-ink/50">
                              {entityLabel(row.entityType)}
                            </p>
                            <p className="truncate text-[0.625rem] text-ink/30">No linked record</p>
                          </div>
                        )}
                      </td>
                      <td className="max-w-[240px] px-3 py-2">
                        <p className="truncate text-ink/60" title={row.changeSummary}>
                          {row.changeSummary}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[0.625rem] text-ink/35">
                        {row.ipAddress ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          pageSize={data.meta.pageSize}
          itemLabel="events"
          onPageChange={(page) => apply({ page })}
          className="border-t border-ink/[0.07] px-4 py-2.5"
        />
      </section>

      {detailId && (
        <OverlayCard
          key={detailId}
          onClose={() => {
            setDetailId(null);
            setDetail(null);
          }}
          labelledBy="audit-detail-title"
          eyebrow="Audit entry"
          title={
            detail
              ? auditActionMeta(detail.action).label
              : detailLoading
                ? "Loading entry…"
                : "Audit entry"
          }
          titleClassName="text-[0.9375rem] font-semibold text-ink"
          meta={
            detail ? (
              <Badge tone={AUDIT_TONE_BADGE[auditActionMeta(detail.action).tone]} surface="light">
                {auditActionMeta(detail.action).domain}
              </Badge>
            ) : null
          }
          panelClassName="max-w-3xl"
        >
          {detail ? (
            <AuditDetail
              detail={detail}
              onViewHistory={viewHistory}
            />
          ) : (
            <AuditDetailSkeleton />
          )}
        </OverlayCard>
      )}
    </div>
  );
}

function AuditDetailSkeleton() {
  return (
    <div className="space-y-5 p-5" aria-hidden="true">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3"
          >
            <div className="h-2 w-20 animate-pulse rounded bg-ink/[0.06]" />
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-ink/[0.06]" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 animate-pulse rounded bg-ink/[0.06]" />
                <div className="h-2.5 w-36 animate-pulse rounded bg-ink/[0.04]" />
              </div>
            </div>
            <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-ink/[0.04]" />
          </div>
        ))}
      </div>

      <div>
        <div className="h-2 w-12 animate-pulse rounded bg-ink/[0.06]" />
        <div className="mt-1.5 rounded-lg border border-ink/[0.07] p-3">
          <div className="h-3 w-1/2 animate-pulse rounded bg-ink/[0.06]" />
          <div className="mt-2 h-2.5 w-1/3 animate-pulse rounded bg-ink/[0.04]" />
          <div className="mt-3 h-7 w-24 animate-pulse rounded-lg bg-ink/[0.05]" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="h-2 w-16 animate-pulse rounded bg-ink/[0.06]" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-ink/[0.05]" />
        </div>
        <div className="mt-2 overflow-hidden rounded-lg border border-ink/[0.07]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-ink/[0.02] px-3 py-1.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-2 w-12 animate-pulse rounded bg-ink/[0.06]" />
            ))}
          </div>
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-ink/[0.05] px-3 py-2.5"
            >
              <div className="h-3 w-3/4 animate-pulse rounded bg-ink/[0.06]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-ink/[0.04]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-ink/[0.05]" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-8 animate-pulse rounded-lg bg-ink/[0.04]" />
    </div>
  );
}

function AuditTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Loading audit entries">
      <table className="w-full min-w-[900px] text-left text-[0.75rem]">
        <thead className="bg-ink/[0.015] text-[0.625rem] uppercase tracking-[0.08em] text-ink/40">
          <tr>
            {["When", "Actor", "Action", "Record", "Change", "Source"].map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/[0.05]">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} aria-hidden="true">
              <td className="px-3 py-2.5">
                <div className="h-3 w-14 animate-pulse rounded bg-ink/[0.06]" />
                <div className="mt-1.5 h-2.5 w-20 animate-pulse rounded bg-ink/[0.04]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-ink/[0.06]" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-ink/[0.06]" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-ink/[0.04]" />
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-md bg-ink/[0.06]" />
                  <div className="h-3 w-32 animate-pulse rounded bg-ink/[0.06]" />
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="h-3 w-24 animate-pulse rounded bg-ink/[0.06]" />
                <div className="mt-1.5 h-2.5 w-32 animate-pulse rounded bg-ink/[0.04]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="h-3 w-40 animate-pulse rounded bg-ink/[0.05]" />
              </td>
              <td className="px-3 py-2.5">
                <div className="h-2.5 w-20 animate-pulse rounded bg-ink/[0.04]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
