"use client";

/* eslint-disable @next/next/no-img-element */
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HeartHandshake,
  Home,
  Mail,
  PawPrint,
  Phone,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { formatDate, formatDateTime, humanize } from "../animals/animals-utils";
import {
  HOUSING_LABELS,
  INTERVIEW_VENUE,
  METHOD_LABELS,
  STATUS_META,
  actionLabelFor,
  actionsFor,
} from "./adoptions-constants";
import type { AdoptionActionKind, AdoptionRow } from "./adoptions-types";

const ACTION_ICONS: Record<AdoptionActionKind, typeof CheckCircle2> = {
  review: ClipboardCheck,
  interview: CalendarClock,
  approve: CheckCircle2,
  reject: X,
  complete: HeartHandshake,
  followup: Plus,
};

const LIFECYCLE_META: Record<string, { label: string; tone: BadgeTone }> = {
  available: { label: "Ready for adoption", tone: "success" },
  adoption_pending: { label: "Pending adoption", tone: "warning" },
  adopted: { label: "Adopted", tone: "info" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function yesNo(value: boolean | null, fallback = "Not answered") {
  if (value === null) return fallback;
  return value ? "Yes" : "No";
}

interface AdoptionDetailProps {
  request: AdoptionRow;
  onClose: () => void;
  onAction: (kind: AdoptionActionKind) => void;
}

export function AdoptionDetail({ request, onClose, onAction }: AdoptionDetailProps) {
  const [now, setNow] = useState<number | null>(null);
  const status = STATUS_META[request.status];
  const actions = actionsFor(
    request.status,
    now === null ? undefined : { schedule: request.interviewSchedule, now },
  );

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const lifecycle =
    LIFECYCLE_META[request.animal.lifecycleStatus] ?? {
      label: humanize(request.animal.lifecycleStatus),
      tone: "neutral" as BadgeTone,
    };

  const timeline = [
    { label: "Application submitted", value: request.createdAt, icon: CalendarClock },
    { label: "Reviewed by the team", value: request.reviewedAt, icon: ShieldCheck },
    { label: `Interview at ${INTERVIEW_VENUE}`, value: request.interviewSchedule, icon: Users },
    { label: "Released to adopter", value: request.releaseDate, icon: CheckCircle2 },
  ].filter((event) => event.value);

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="adoption-detail-title"
      eyebrow="Adoption application"
      title={request.requestCode}
      meta={
        <Badge tone={status.tone} surface="light">
          {status.label}
        </Badge>
      }
      panelClassName="sm:max-w-3xl"
      showClose={false}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-ink/45">
            <CalendarClock className="h-3.5 w-3.5 text-ink/30" strokeWidth={1.8} />
            Received {formatDate(request.createdAt)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((kind) => {
              const Icon = ACTION_ICONS[kind];
              return (
                <Button
                  key={kind}
                  size="sm"
                  variant={
                    kind === "reject"
                      ? "dangerGhost"
                      : kind === "review" || kind === "approve"
                        ? "primary"
                        : "secondary"
                  }
                  onClick={() => onAction(kind)}
                >
                  <Icon className="h-3 w-3" strokeWidth={2} />
                  {actionLabelFor(kind, request.status)}
                </Button>
              );
            })}
          </div>
        </div>
      }
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-white p-3.5">
              {request.animal.primaryPhotoUrl ? (
                <img
                  src={request.animal.primaryPhotoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink/[0.05] text-ink/30">
                  <PawPrint className="h-5 w-5" strokeWidth={1.8} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                  Animal
                </p>
                <p className="mt-1 truncate text-[0.875rem] font-semibold text-ink/85">
                  {request.animal.name?.trim() || request.animal.animalCode}
                </p>
                <p className="truncate font-mono text-[0.625rem] text-ink/45">
                  {request.animal.animalCode} · {humanize(request.animal.species)}
                </p>
                <Badge tone={lifecycle.tone} surface="light" className="mt-1.5">
                  {lifecycle.label}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-ink/[0.07] bg-white p-3.5">
              <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink/35">
                Applicant
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-clay/10 text-[0.75rem] font-semibold text-clay">
                  {initials(request.adopter.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.875rem] font-semibold text-ink/85">
                    {request.adopter.name}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-[0.6875rem] text-ink/50">
                    <Mail className="h-3 w-3 shrink-0 text-ink/30" strokeWidth={1.8} />
                    {request.adopter.email}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-[0.6875rem] text-ink/50">
                    <Phone className="h-3 w-3 shrink-0 text-ink/30" strokeWidth={1.8} />
                    {request.adopter.phoneNumber ?? "No phone number"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section>
            <SectionTitle icon={Home} label="Living situation" />
            <dl className="mt-2.5 grid gap-px overflow-hidden rounded-xl border border-ink/[0.07] bg-ink/[0.06] sm:grid-cols-2">
              <SituationCell
                label="Housing"
                value={HOUSING_LABELS[request.housingType]}
              />
              <SituationCell
                label="Property"
                value={
                  request.isOwnedProperty === null
                    ? "Not answered"
                    : request.isOwnedProperty
                      ? "Owned"
                      : "Rented"
                }
              />
              <SituationCell label="Fenced area" value={yesNo(request.hasFencedArea)} />
              <SituationCell
                label="Household size"
                value={
                  request.householdMembers === null
                    ? "Not answered"
                    : `${request.householdMembers} ${
                        request.householdMembers === 1 ? "person" : "people"
                      }`
                }
              />
              <SituationCell
                label="Other pets"
                className="sm:col-span-2"
                value={
                  request.hasOtherPets === null
                    ? "Not answered"
                    : request.hasOtherPets
                      ? request.otherPetsDetails || "Yes, but no details were provided"
                      : "No other pets at home"
                }
              />
              <SituationCell
                label="Prior pet experience"
                className="sm:col-span-2"
                value={request.priorPetExperience || "Not recorded"}
              />
            </dl>
          </section>

          <section>
            <SectionTitle icon={HeartHandshake} label="Why they want to adopt" />
            <p className="mt-2.5 whitespace-pre-line rounded-xl border border-ink/[0.07] border-l-2 border-l-clay bg-[#fafaf9] px-4 py-3.5 text-[0.8125rem] leading-[1.7] text-ink/70">
              {request.reasonForAdopting}
            </p>
          </section>

          <section>
            <SectionTitle icon={FileText} label="Documents" />
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              <DocumentLink
                href={request.validIdUrl}
                label="Valid ID"
                description="Identity document"
              />
              {request.homePhotoUrl && (
                <DocumentLink
                  href={request.homePhotoUrl}
                  label="Home photo"
                  description="Photo of the residence"
                />
              )}
            </div>
          </section>

          <section>
            <SectionTitle icon={CalendarClock} label="Timeline" />
            <ol className="mt-3 space-y-0">
              {timeline.map((event, index, list) => {
                const Icon = event.icon;
                return (
                  <li key={event.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < list.length - 1 && (
                      <span className="absolute left-[9px] top-5 h-full w-px bg-ink/10" />
                    )}
                    <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-clay/30 bg-clay/10 text-clay">
                      <Icon className="h-2.5 w-2.5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.75rem] font-semibold text-ink/75">
                        {event.label}
                      </p>
                      <p className="mt-0.5 text-[0.625rem] text-ink/40">
                        {formatDateTime(event.value)}
                        {request.reviewer ? ` · ${request.reviewer.name}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
              {request.decisionRemarks && (
                <li className="relative flex gap-3">
                  <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-ink/15 bg-ink/[0.04] text-ink/45">
                    <FileText className="h-2.5 w-2.5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.75rem] font-semibold text-ink/75">
                      Decision remarks
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/50">
                      {request.decisionRemarks}
                    </p>
                  </div>
                </li>
              )}
            </ol>
          </section>

          <section>
            <SectionTitle
              icon={HeartHandshake}
              label="Post-adoption follow-ups"
              hint={`${request.followups.length}`}
            />
            {request.followups.length === 0 ? (
              <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-dashed border-ink/15 bg-ink/[0.012] px-4 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink/30 ring-1 ring-ink/[0.06]">
                  <HeartHandshake className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-[0.75rem] font-medium text-ink/70">
                    No follow-ups recorded yet
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-ink/45">
                    Welfare checks appear here after the animal is released.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {request.followups.map((followup) => (
                  <li
                    key={followup.id}
                    className="rounded-xl border border-ink/[0.07] bg-white px-3.5 py-3"
                  >
                    <p className="flex flex-wrap items-center gap-x-2 text-[0.75rem] font-medium text-ink/70">
                      <span>{formatDate(followup.followupDate)}</span>
                      {followup.method && (
                        <span className="text-ink/45">
                          · {METHOD_LABELS[followup.method]}
                        </span>
                      )}
                      {followup.animalCondition && (
                        <span className="text-ink/45">· {followup.animalCondition}</span>
                      )}
                    </p>
                    {followup.remarks && (
                      <p className="mt-1 text-[0.6875rem] leading-[1.5] text-ink/50">
                        {followup.remarks}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </ScrollArea>
    </OverlayCard>
  );
}

function SectionTitle({
  icon: Icon,
  label,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
      <Icon className="h-3.5 w-3.5 text-ink/30" strokeWidth={1.9} />
      {label}
      {hint !== undefined && (
        <span className="rounded-full bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[0.5625rem] tabular-nums text-ink/45">
          {hint}
        </span>
      )}
    </h3>
  );
}

function SituationCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 bg-white px-3.5 py-3 ${className}`}>
      <dt className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.8125rem] leading-[1.5] text-ink/75">{value}</dd>
    </div>
  );
}

function DocumentLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-ink/[0.07] bg-white px-3.5 py-3 transition-colors hover:border-ink/20 hover:bg-ink/[0.015]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/[0.04] text-ink/40 transition-colors group-hover:text-ink/60">
        <FileText className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.75rem] font-semibold text-ink/75">{label}</p>
        <p className="text-[0.625rem] text-ink/40">{description}</p>
      </div>
      <ExternalLink
        className="h-3.5 w-3.5 shrink-0 text-ink/25 transition-colors group-hover:text-ink/50"
        strokeWidth={1.9}
      />
    </a>
  );
}
