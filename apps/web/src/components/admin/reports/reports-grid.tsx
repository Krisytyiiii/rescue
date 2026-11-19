/* eslint-disable @next/next/no-img-element */
"use client";

import { Clock, FileWarning, MapPin, PawPrint, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ReportActions } from "./report-actions";
import { ReportLocationMap } from "./report-location-map";

export interface ReportCardData {
  id: string;
  reportCode: string;
  reportType: string;
  species: string;
  description: string;
  urgencyLevel: string;
  animalCount: number;
  status: string;
  submittedAt: string;
  latitude: number;
  longitude: number;
  locationLandmark: string | null;
  duplicateOfReportId: string | null;
  barangay: string | null;
  reporter: string;
  verifier: string | null;
  photoUrl: string | null;
  resultingAnimal: string | null;
  statusHistory: Array<{
    id: string;
    oldStatus: string | null;
    newStatus: string;
    remarks: string | null;
    changedAt: string;
  }>;
  rescue: {
    rescuer: string;
    status: string;
    assignedAt: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In progress",
  rescued: "Rescued",
  unable_to_locate: "Unable to locate",
  rejected: "Rejected",
  closed: "Closed",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  submitted: "pending",
  verified: "info",
  assigned: "info",
  in_progress: "progress",
  rescued: "success",
  unable_to_locate: "warning",
  rejected: "danger",
  closed: "neutral",
};

const URGENCY_TONES: Record<string, BadgeTone> = {
  critical: "danger",
  high: "warning",
  medium: "pending",
  low: "neutral",
};

/** Assignment progress tones: pending amber, working states teal, done green. */
const ASSIGNMENT_TONES: Record<string, BadgeTone> = {
  pending: "pending",
  accepted: "info",
  en_route: "progress",
  on_site: "progress",
  completed: "success",
  declined: "warning",
  failed: "danger",
};

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function label(value: string): string {
  return STATUS_LABELS[value] ?? humanize(value);
}

function Field({ label: fieldLabel, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {fieldLabel}
      </dt>
      <dd className="mt-0.5 truncate text-[0.8125rem] font-medium text-ink/75">{value}</dd>
    </div>
  );
}

function ReportTimeBadge({ submittedAt }: { submittedAt: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a1d33] px-2.5 py-0.5 text-[0.625rem] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(6,24,43,0.7)] ring-1 ring-inset ring-white/20">
      <Clock className="h-3 w-3 shrink-0 text-white/70" strokeWidth={1.8} />
      <span className="font-medium text-white/70">Reported</span>
      <span className="tabular-nums">{dateFormatter.format(new Date(submittedAt))}</span>
    </span>
  );
}

function BadgeRow({
  report,
  surface = "dark",
}: {
  report: ReportCardData;
  surface?: "dark" | "light";
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="light" surface={surface} className="capitalize">
        <PawPrint className="h-3 w-3" strokeWidth={2} />
        {report.species}
      </Badge>
      <Badge tone={STATUS_TONES[report.status] ?? "neutral"} surface={surface}>
        {label(report.status)}
      </Badge>
      <Badge
        tone={URGENCY_TONES[report.urgencyLevel] ?? "neutral"}
        surface={surface}
        className="capitalize"
      >
        {report.urgencyLevel}
      </Badge>
      {report.duplicateOfReportId && (
        <Badge tone="warning" surface={surface}>
          Possible duplicate
        </Badge>
      )}
    </div>
  );
}

export function ReportsGrid({ reports }: { reports: ReportCardData[] }) {
  const [selected, setSelected] = useState<ReportCardData | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");

  // Once fresh server data arrives, drop the optimistic overrides.
  useEffect(() => {
    setOptimisticStatus({});
  }, [reports]);

  useEffect(() => {
    if (!actionError) return;
    const timer = window.setTimeout(() => setActionError(""), 8_000);
    return () => window.clearTimeout(timer);
  }, [actionError]);

  function markStatus(id: string, status: string) {
    setOptimisticStatus((current) => ({ ...current, [id]: status }));
  }

  return (
    <>
      {actionError && (
        <div className="px-4 pt-4">
          <FormAlert message={actionError} />
        </div>
      )}

      <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const status = optimisticStatus[report.id] ?? report.status;

          return (
          <li key={report.id} className="h-full">
            <article
              role="button"
              tabIndex={0}
              aria-label={`Open report ${report.reportCode}`}
              onClick={() => setSelected(report)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(report);
                }
              }}
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white text-left outline-none transition-shadow hover:shadow-[0_16px_36px_-24px_rgba(10,29,51,0.5)] focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2"
            >
              <div className="relative h-64 w-full shrink-0 overflow-hidden bg-[#0a1d33]">
                {report.photoUrl ? (
                  <img
                    src={report.photoUrl}
                    alt={`Photo attached to ${report.reportCode}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-white/25">
                    <FileWarning className="h-7 w-7" strokeWidth={1.5} />
                    <span className="sr-only">No photo attached</span>
                  </span>
                )}

                <div className="pointer-events-none absolute inset-0 bg-[#0a1d33]/15" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06182b] via-[#06182b]/70 to-transparent" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                  <Badge tone="neutral" className="font-mono tracking-wide">
                    {report.reportCode}
                  </Badge>
                  <ReportTimeBadge submittedAt={report.submittedAt} />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3">
                  <p className="line-clamp-4 text-[0.8125rem] leading-[1.5] text-white/85">
                    {report.description}
                  </p>
                  <div className="flex justify-end">
                    <BadgeRow report={{ ...report, status }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <Field label="Type" value={humanize(report.reportType)} />
                  <Field label="Barangay" value={report.barangay ?? "Unmatched"} />
                  <Field label="Reporter" value={report.reporter} />
                  <Field label="Animal count" value={String(report.animalCount)} />
                </dl>

                {report.rescue && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#2563eb]/15 bg-[#2563eb]/[0.04] px-3 py-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2563eb]/10 text-[#1d4ed8]">
                      <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/40">
                        Assigned rescuer
                      </p>
                      <p className="truncate text-[0.75rem] font-semibold text-ink/80">
                        {report.rescue.rescuer}
                      </p>
                    </div>
                    <Badge
                      tone={ASSIGNMENT_TONES[report.rescue.status] ?? "neutral"}
                      surface="light"
                    >
                      {humanize(report.rescue.status)}
                    </Badge>
                  </div>
                )}

                {report.locationLandmark && (
                  <p className="mt-2.5 flex items-start gap-1.5 text-[0.6875rem] leading-[1.5] text-ink/45">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.8} />
                    <span className="line-clamp-2">{report.locationLandmark}</span>
                  </p>
                )}

                <div
                  className="mt-auto pt-3"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ReportActions
                    id={report.id}
                    status={status}
                    onOptimisticStatus={(next) => markStatus(report.id, next)}
                    onActionError={setActionError}
                  />
                  {report.resultingAnimal && (
                    <p className="mt-2 text-[0.6875rem] text-ink/40">
                      Intake {report.resultingAnimal}
                    </p>
                  )}
                </div>
              </div>
            </article>
          </li>
          );
        })}
      </ul>

      {selected && (
        <ReportModal
          report={selected}
          onClose={() => setSelected(null)}
          onOptimisticStatus={(next) => markStatus(selected.id, next)}
          onActionError={setActionError}
        />
      )}
    </>
  );
}

function ReportModal({
  report,
  onClose,
  onOptimisticStatus,
  onActionError,
}: {
  report: ReportCardData;
  onClose: () => void;
  onOptimisticStatus: (status: string) => void;
  onActionError: (message: string) => void;
}) {
  const hasActions = ["submitted", "verified", "assigned"].includes(report.status);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="report-modal-title"
      closeLabel="Close report details"
      eyebrow="Community report"
      title={report.reportCode}
      meta={
        <>
          <BadgeRow report={report} surface="light" />
          <ReportTimeBadge submittedAt={report.submittedAt} />
        </>
      }
      footer={
        hasActions ? (
          <div className="w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
            <ReportActions
              id={report.id}
              status={report.status}
              onDone={onClose}
              onOptimisticStatus={onOptimisticStatus}
              onActionError={onActionError}
            />
          </div>
        ) : undefined
      }
    >
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative h-56 shrink-0 bg-[#0a1d33] md:h-full md:min-h-[480px]">
              {report.photoUrl ? (
                <img
                  src={report.photoUrl}
                  alt={`Photo attached to ${report.reportCode}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-white/25">
                  <FileWarning className="h-8 w-8" strokeWidth={1.5} />
                </span>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06182b]/70 via-transparent to-transparent" />
            </div>

            <div className="space-y-5 p-5">
              <section>
                <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                  Description
                </h3>
                <p className="mt-2 text-[0.875rem] leading-[1.65] text-ink/75">
                  {report.description}
                </p>
              </section>

              <section>
                <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                  Report details
                </h3>
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-ink/[0.07] bg-ink/[0.012] p-3.5">
                  <Field label="Type" value={humanize(report.reportType)} />
                  <Field label="Species" value={humanize(report.species)} />
                  <Field label="Animal count" value={String(report.animalCount)} />
                  <Field label="Barangay" value={report.barangay ?? "Unmatched"} />
                  <Field label="Reporter" value={report.reporter} />
                  <Field label="Verified by" value={report.verifier ?? "Not verified"} />
                </dl>
              </section>

              <section>
                <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                  Location
                </h3>
                <div className="mt-2 space-y-2 text-[0.8125rem] leading-[1.6] text-ink/70">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/35" strokeWidth={1.8} />
                    <span>{report.locationLandmark ?? "No landmark provided"}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-ink/45">
                    <span className="font-mono">
                      {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                    </span>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-clay underline-offset-2 hover:underline"
                    >
                      Open in Maps
                    </a>
                  </div>
                  <ReportLocationMap
                    latitude={report.latitude}
                    longitude={report.longitude}
                    label={report.locationLandmark}
                  />
                </div>
              </section>

              {report.rescue && (
                <section>
                  <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                    Rescue assignment
                  </h3>
                  <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[#2563eb]/15 bg-[#2563eb]/[0.04] px-3 py-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2563eb]/10 text-[#1d4ed8]">
                      <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-semibold text-ink/80">
                        {report.rescue.rescuer}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-ink/45">
                        {dateFormatter.format(new Date(report.rescue.assignedAt))}
                      </p>
                    </div>
                    <Badge
                      tone={ASSIGNMENT_TONES[report.rescue.status] ?? "neutral"}
                      surface="light"
                    >
                      {humanize(report.rescue.status)}
                    </Badge>
                  </div>
                </section>
              )}

              {report.statusHistory.length > 0 && (
                <section>
                  <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                    Timeline
                  </h3>
                  <ol className="mt-3 space-y-0">
                    {report.statusHistory.slice(0, 5).map((entry, index, list) => (
                      <li key={entry.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                        {index < list.length - 1 && (
                          <span className="absolute left-[5px] top-3 h-full w-px bg-ink/10" />
                        )}
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-clay ring-1 ring-clay/40" />
                        <div className="min-w-0">
                          <p className="text-[0.75rem] font-medium text-ink/75">
                            {label(entry.newStatus)}
                          </p>
                          {entry.remarks && (
                            <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-[1.5] text-ink/45">
                              {entry.remarks}
                            </p>
                          )}
                          <p className="mt-0.5 text-[0.625rem] text-ink/35">
                            {dateFormatter.format(new Date(entry.changedAt))}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </ScrollArea>
    </OverlayCard>
  );
}
