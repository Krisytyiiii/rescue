"use client";

import { ArrowUpRight, History, UserRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { auditActionMeta, entityLabel, recordHref } from "./audit-meta";

import type { AuditLogDetail } from "@furescue/core";

const FULL = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function AuditDetail({
  detail,
  onViewHistory,
}: {
  detail: AuditLogDetail;
  onViewHistory: (entityType: string, entityId: string) => void;
}) {
  const meta = auditActionMeta(detail.action);

  return (
    <ScrollArea className="min-h-0 flex-1 p-5">
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
              Performed by
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              {detail.actor?.profilePhotoUrl ? (
                <img
                  src={detail.actor.profilePhotoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-ink/45">
                  <UserRound className="h-4 w-4" strokeWidth={1.8} />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[0.8125rem] font-semibold text-ink/80">
                  {detail.actor?.fullName ?? "System / automated"}
                </p>
                <p className="truncate text-[0.6875rem] capitalize text-ink/45">
                  {detail.actor?.role.replaceAll("_", " ") ?? "no account"}
                  {detail.actor?.email ? ` · ${detail.actor.email}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
              When &amp; source
            </p>
            <p className="mt-2 text-[0.8125rem] font-medium text-ink/80">
              {FULL.format(new Date(detail.createdAt))}
            </p>
            <p className="mt-0.5 font-mono text-[0.6875rem] text-ink/45">
              {detail.ipAddress ?? "No source address recorded"}
            </p>
          </div>
        </section>

        <section>
          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
            Record
          </p>
          <div className="mt-1.5 rounded-lg border border-ink/[0.07] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold text-ink/80">
                  {detail.record?.title ?? entityLabel(detail.entityType)}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-ink/45">
                  {entityLabel(detail.entityType)}
                  {detail.record?.code ? (
                    <>
                      {" · "}
                      <span className="font-mono text-[0.6875rem] font-semibold text-ink/60">
                        {detail.record.code}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              {detail.record && (
                <Link
                  href={recordHref(detail.record)}
                  className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-clay hover:underline"
                >
                  Open record
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              )}
            </div>
            {detail.entityType && detail.entityId && (
              <Button
                size="xs"
                variant="ghost"
                className="mt-2"
                onClick={() => onViewHistory(detail.entityType!, detail.entityId!)}
              >
                <History className="h-3 w-3" strokeWidth={2} />
                View full history
              </Button>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
              Changes
            </p>
            <Badge tone="neutral" surface="light">
              {detail.changes.length} field{detail.changes.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {detail.redacted && (
            <p className="mt-2 rounded-lg bg-[#b45309]/10 px-3 py-2 text-[0.6875rem] leading-[1.5] text-[#92400e]">
              Sensitive values in this entry were hidden before display.
            </p>
          )}

          {detail.changes.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-ink/15 px-3 py-4 text-center text-[0.75rem] text-ink/40">
              No field-level changes were recorded for this action.
            </p>
          ) : (
            <div className="mt-2 overflow-hidden rounded-lg border border-ink/[0.07]">
              <div
                className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-ink/[0.02] px-3 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-ink/35"
              >
                <span>Field</span>
                <span>Before</span>
                <span>After</span>
              </div>
              <ul className="divide-y divide-ink/[0.05]">
                {detail.changes.map((change) => (
                  <li
                    key={change.path}
                    className="grid grid-cols-1 gap-1.5 px-3 py-2.5 text-[0.6875rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-2 sm:py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink/70">{change.label}</span>
                      <span className="block truncate font-mono text-[0.5625rem] text-ink/30">
                        {change.path}
                      </span>
                    </span>
                    <span className="min-w-0 break-words text-ink/45">
                      <span className="mb-0.5 block text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-ink/30 sm:hidden">
                        Before
                      </span>
                      {change.before ?? <span className="italic text-ink/25">None</span>}
                    </span>
                    <span className="min-w-0 break-words font-medium text-ink/75">
                      <span className="mb-0.5 block text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-ink/30 sm:hidden">
                        After
                      </span>
                      {change.after ?? <span className="italic text-ink/25">None</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <details className="group rounded-lg border border-ink/[0.07] bg-ink/[0.015]">
          <summary className="cursor-pointer list-none px-3 py-2 text-[0.6875rem] font-medium text-ink/55 transition-colors hover:text-ink">
            Technical details
            <span className="ml-1 text-ink/30 group-open:hidden">(show raw payload)</span>
          </summary>
          <div className="space-y-2 border-t border-ink/[0.06] p-3">
            <div>
              <p className="mb-1 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
                Before
              </p>
              <pre className="max-h-40 overflow-auto rounded-md bg-white p-2 font-mono text-[0.625rem] leading-[1.5] text-ink/60">
                {JSON.stringify(detail.oldValue ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
                After
              </p>
              <pre className="max-h-40 overflow-auto rounded-md bg-white p-2 font-mono text-[0.625rem] leading-[1.5] text-ink/60">
                {JSON.stringify(detail.newValue ?? null, null, 2)}
              </pre>
            </div>
          </div>
        </details>

        <p className="text-[0.625rem] leading-[1.5] text-ink/35">
          {meta.label} · Entry {detail.id.slice(0, 8)} · Audit records cannot be edited or
          deleted.
        </p>
      </div>
    </ScrollArea>
  );
}
