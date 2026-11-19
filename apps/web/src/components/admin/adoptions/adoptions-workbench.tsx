"use client";

/* eslint-disable @next/next/no-img-element */
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  Inbox,
  MapPin,
  PawPrint,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Pagination } from "@/components/ui/pagination";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { TabFilters } from "@/components/ui/tab-filters";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/components/ui/toast";

import { formatDate, formatDateTime, humanize } from "../animals/animals-utils";
import { AdoptionAnimalsList } from "./adoptions-animals-list";
import { AdoptionDetail } from "./adoption-detail";
import {
  HOUSING_LABELS,
  INTERVIEW_VENUE,
  METHOD_LABELS,
  STATUS_META,
  actionLabelFor,
  primaryActionFor,
} from "./adoptions-constants";
import type {
  AdoptionActionKind,
  AdoptionAnimalListRow,
  AdoptionRow,
  FollowupMethod,
} from "./adoptions-types";

const PAGE_SIZE = 12;

const PRIMARY_ACTION_ICONS: Record<AdoptionActionKind, LucideIcon> = {
  review: ClipboardCheck,
  interview: CalendarClock,
  approve: CheckCircle2,
  reject: Plus,
  complete: HeartHandshake,
  followup: Plus,
};

const TABS = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under review" },
  { id: "interview_scheduled", label: "Interview" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

const SPECIES_OPTIONS = [
  { value: "", label: "All species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "interview", label: "Interview date" },
];

const METHOD_OPTIONS = [
  { value: "in_app", label: "In-app" },
  { value: "phone", label: "Phone call" },
  { value: "visit", label: "Home visit" },
];

const CLOSED_STATUSES = ["rejected", "withdrawn"];

function matches(haystack: Array<string | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.filter(Boolean).join(" ").toLowerCase().includes(needle);
}

function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function currentTimeInput(): string {
  const now = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Next 5-minute slot from now, used as a safe default for today's interviews. */
function nextInterviewTimeSlot(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function interviewTimeFor(date: string, time: string): string {
  if (date !== todayInput()) return time || "09:00";
  const earliest = currentTimeInput();
  return time && time >= earliest ? time : nextInterviewTimeSlot();
}

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function keyDate(row: AdoptionRow): string {
  switch (row.status) {
    case "submitted":
      return "Awaiting review";
    case "under_review":
      return row.reviewedAt ? formatDate(row.reviewedAt) : "—";
    case "interview_scheduled":
      return row.interviewSchedule
        ? formatDateTime(row.interviewSchedule)
        : "Not scheduled";
    case "approved":
      return row.reviewedAt ? formatDate(row.reviewedAt) : "—";
    case "completed":
      return row.releaseDate ? formatDate(row.releaseDate) : "—";
    default:
      return row.reviewedAt ? formatDate(row.reviewedAt) : "—";
  }
}

function housingSummary(row: AdoptionRow): string {
  const parts = [HOUSING_LABELS[row.housingType]];
  if (row.isOwnedProperty !== null) {
    parts.push(row.isOwnedProperty ? "owned" : "rented");
  }
  if (row.hasFencedArea) parts.push("fenced");
  if (row.householdMembers !== null) {
    parts.push(`${row.householdMembers} ${row.householdMembers === 1 ? "person" : "people"}`);
  }
  return parts.join(" · ");
}

interface AdoptionWorkbenchProps {
  requests: AdoptionRow[];
  animals: AdoptionAnimalListRow[];
  initialTab?: TabId;
  initialView?: "animals" | "applications";
  initialQuery?: string;
}

export function AdoptionWorkbench({
  requests,
  animals,
  initialTab = "all",
  initialView = "applications",
  initialQuery = "",
}: AdoptionWorkbenchProps) {
  const router = useRouter();
  const toast = useToast();

  const view = initialView;
  const [rows, setRows] = useState<AdoptionRow[]>(requests);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [species, setSpecies] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    kind: AdoptionActionKind;
    requestId: string;
  } | null>(null);

  // Dialog form fields
  const [interviewAt, setInterviewAt] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupMethod, setFollowupMethod] = useState<FollowupMethod>("in_app");
  const [followupCondition, setFollowupCondition] = useState("");
  const [followupRemarks, setFollowupRemarks] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const counts = useMemo(() => {
    const open = new Set(["submitted", "under_review"]);
    return {
      pending: rows.filter((row) => open.has(row.status)).length,
      interviews: rows.filter((row) => row.status === "interview_scheduled").length,
      approved: rows.filter((row) => row.status === "approved").length,
      completed: rows.filter((row) => row.status === "completed").length,
    };
  }, [rows]);

  const tabCounts = useMemo(() => {
    const result: Record<TabId, number> = {
      all: rows.length,
      submitted: 0,
      under_review: 0,
      interview_scheduled: 0,
      approved: 0,
      completed: 0,
      closed: 0,
    };
    for (const row of rows) {
      if (row.status === "rejected" || row.status === "withdrawn") {
        result.closed += 1;
      } else {
        result[row.status] += 1;
      }
    }
    return result;
  }, [rows]);

  const filtered = useMemo(() => {
    const items = rows.filter((row) => {
      if (tab === "closed") {
        if (!CLOSED_STATUSES.includes(row.status)) return false;
      } else if (tab !== "all" && row.status !== tab) {
        return false;
      }
      if (species && row.animal.species !== species) return false;
      return matches(
        [
          row.requestCode,
          row.animal.animalCode,
          row.animal.name,
          row.adopter.name,
          row.adopter.email,
          row.adopter.phoneNumber,
        ],
        query,
      );
    });

    return items.sort((a, b) => {
      if (sort === "interview") {
        const aTime = a.interviewSchedule
          ? new Date(a.interviewSchedule).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = b.interviewSchedule
          ? new Date(b.interviewSchedule).getTime()
          : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [rows, tab, species, query, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const selected = selectedId ? rows.find((row) => row.id === selectedId) ?? null : null;
  const activeRequest = dialog
    ? rows.find((row) => row.id === dialog.requestId) ?? null
    : null;

  const hasFilters = Boolean(query || species || tab !== "all" || sort !== "newest");

  function clearFilters() {
    setQuery("");
    setSpecies("");
    setTab("all");
    setSort("newest");
    setPage(1);
  }

  function openAction(kind: AdoptionActionKind, request: AdoptionRow) {
    setSelectedId(null);
    setDialog({ kind, requestId: request.id });
    setInterviewAt(toLocalInput(request.interviewSchedule));
    setRejectReason("");
    setReleaseDate(todayInput());
    setFollowupDate(todayInput());
    setFollowupMethod("in_app");
    setFollowupCondition("");
    setFollowupRemarks("");
  }

  function patch(id: string, changes: Partial<AdoptionRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  async function post(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(json?.error?.message ?? "The request could not be completed");
    }
    return json;
  }

  async function runAction() {
    if (!dialog || !activeRequest) return;
    const request = activeRequest;
    const kind = dialog.kind;
    const base = `/api/admin/adoptions/${request.id}`;
    const now = new Date().toISOString();
    const previous = rows;

    setDialog(null);
    setSelectedId(null);

    try {
      if (kind === "review") {
        patch(request.id, { status: "under_review", reviewedAt: now });
        await post(`${base}/review`, { status: "under_review" });
        toast.success("Review started", {
          description: `${request.requestCode} is now under review.`,
        });
      } else if (kind === "interview") {
        const schedule = new Date(interviewAt).toISOString();
        const reschedule = request.status === "interview_scheduled";
        patch(request.id, {
          status: "interview_scheduled",
          reviewedAt: now,
          interviewSchedule: schedule,
        });
        await post(`${base}/review`, {
          status: "interview_scheduled",
          interviewSchedule: schedule,
        });
        toast.success(reschedule ? "Interview updated" : "Interview scheduled", {
          description: `${request.requestCode} — ${formatDateTime(schedule)}.`,
        });
      } else if (kind === "approve") {
        setRows((current) =>
          current.map((row) => {
            if (row.id === request.id) {
              return { ...row, status: "approved", reviewedAt: now };
            }
            if (
              row.animal.id === request.animal.id &&
              ["submitted", "under_review", "interview_scheduled"].includes(row.status)
            ) {
              return {
                ...row,
                status: "rejected",
                reviewedAt: now,
                decisionRemarks: "Another applicant was approved for this animal",
              };
            }
            return row;
          }),
        );
        await post(`${base}/review`, { status: "approved" });
        toast.success("Applicant approved", {
          description: `${request.requestCode} for ${request.animal.animalCode}. Other applications were closed.`,
        });
      } else if (kind === "reject") {
        const remarks = rejectReason.trim();
        patch(request.id, {
          status: "rejected",
          reviewedAt: now,
          decisionRemarks: remarks,
        });
        await post(`${base}/review`, {
          status: "rejected",
          decisionRemarks: remarks,
        });
        toast.success("Application rejected", {
          description: `${request.requestCode} was closed.`,
        });
      } else if (kind === "complete") {
        const release = new Date(`${releaseDate}T00:00:00`).toISOString();
        patch(request.id, { status: "completed", releaseDate: release });
        await post(`${base}/complete`, { releaseDate: release });
        toast.success("Adoption completed", {
          description: `${request.animal.animalCode} is now adopted.`,
        });
      } else if (kind === "followup") {
        const followupAt = new Date(`${followupDate}T00:00:00`).toISOString();
        const followup = {
          id: `temp-${Date.now()}`,
          followupDate: followupAt,
          method: followupMethod,
          animalCondition: followupCondition.trim() || null,
          remarks: followupRemarks.trim() || null,
        };
        setRows((current) =>
          current.map((row) =>
            row.id === request.id
              ? { ...row, followups: [followup, ...row.followups] }
              : row,
          ),
        );
        await post(`${base}/followups`, {
          followupDate: followupAt,
          method: followupMethod,
          animalCondition: followupCondition.trim() || undefined,
          remarks: followupRemarks.trim() || undefined,
        });
        toast.success("Follow-up recorded", {
          description: `${request.animal.animalCode} — ${formatDate(followupAt)}.`,
        });
      }
      router.refresh();
    } catch (error) {
      setRows(previous);
      toast.error("Couldn't update the application", {
        description: `${
          error instanceof Error ? error.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  const dialogConfig = dialogConfigFor(dialog?.kind, activeRequest, {
    interviewAt,
    rejectReason,
    releaseDate,
    followupDate,
  });

  return (
    <>
      {view === "applications" ? (
        <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending review"
          value={counts.pending}
          hint="Submitted or under review"
          icon={Inbox}
          tone="clay"
          href="/admin/adoptions?tab=submitted"
        />
        <StatCard
          label="Interviews scheduled"
          value={counts.interviews}
          hint="Awaiting the meet-and-greet"
          icon={CalendarClock}
          tone="amber"
          href="/admin/adoptions?tab=interview_scheduled"
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          hint="Waiting for release"
          icon={ClipboardCheck}
          tone="moss"
          href="/admin/adoptions?tab=approved"
        />
        <StatCard
          label="Completed adoptions"
          value={counts.completed}
          hint="Released and followed up"
          icon={HeartHandshake}
          tone="forest"
          href="/admin/adoptions?tab=completed"
        />
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-wrap items-center gap-1 border-b border-ink/[0.07] px-4 py-3">
          <TabFilters
            ariaLabel="Application status"
            value={tab}
            onChange={(next) => {
              setTab(next);
              setPage(1);
            }}
            options={TABS.map((item) => ({
              ...item,
              count: tabCounts[item.id],
            }))}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-ink/[0.07] px-4 py-2.5">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[0.75rem] font-medium text-ink/45 transition-colors hover:text-ink"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search request, adopter, animal…"
              className="w-56 shrink-0 sm:w-64"
            />
            <Select
              name="adoption-species"
              value={species}
              onChange={(value) => {
                setSpecies(value);
                setPage(1);
              }}
              options={SPECIES_OPTIONS}
              size="compact"
              className="w-32"
            />
            <Select
              name="adoption-sort"
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              size="compact"
              className="w-36"
            />
          </div>
        </div>

        {paged.length === 0 ? (
          <SearchEmpty
            compact
            icon={rows.length === 0 ? HeartHandshake : undefined}
            title={
              rows.length === 0
                ? "No adoption applications yet"
                : "No applications match your filters"
            }
            description={
              rows.length === 0
                ? "Applications submitted from the public adoption page appear here."
                : "Try another status, species, or search term."
            }
            onClear={rows.length === 0 ? undefined : clearFilters}
            clearLabel="Clear filters"
          />
        ) : (
          <>
            <div className="hidden items-center gap-4 border-b border-ink/[0.06] bg-[#fafaf9] px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink/35 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_7.5rem_7rem_9rem]">
              <span>Application</span>
              <span>Animal</span>
              <span>Adopter</span>
              <span>Home</span>
              <span>Key date</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            <ul className="divide-y divide-ink/[0.06]">
              {paged.map((row) => {
                const status = STATUS_META[row.status];
                const primary = primaryActionFor(
                  row.status,
                  now === null
                    ? undefined
                    : { schedule: row.interviewSchedule, now },
                );
                const PrimaryIcon = primary ? PRIMARY_ACTION_ICONS[primary] : null;
                return (
                  <li
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(row.id);
                      }
                    }}
                    className="grid cursor-pointer gap-2 px-4 py-3 transition-colors hover:bg-ink/[0.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_7.5rem_7rem_9rem] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[0.6875rem] font-semibold tracking-wide text-ink/75">
                        {row.requestCode}
                      </p>
                      <p className="mt-0.5 text-[0.625rem] text-ink/45">
                        Received {formatDate(row.createdAt)}
                        {row.reviewer ? ` · ${row.reviewer.name}` : ""}
                      </p>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 pl-[3.25rem] sm:pl-0">
                      {row.animal.primaryPhotoUrl ? (
                        <img
                          src={row.animal.primaryPhotoUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink/[0.05] text-ink/30">
                          <PawPrint className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[0.6875rem] font-semibold text-ink/80">
                          {row.animal.name?.trim() || row.animal.animalCode}
                        </span>
                        <span className="block truncate font-mono text-[0.625rem] text-ink/40">
                          {row.animal.animalCode} · {humanize(row.animal.species)}
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0 pl-[3.25rem] sm:pl-0">
                      <p className="truncate text-[0.6875rem] font-medium text-ink/75">
                        {row.adopter.name}
                      </p>
                      <p className="truncate text-[0.625rem] text-ink/45">
                        {row.adopter.email}
                      </p>
                      <p className="truncate text-[0.625rem] text-ink/40">
                        {row.adopter.phoneNumber ?? "No phone"}
                      </p>
                    </div>

                    <div className="min-w-0 pl-[3.25rem] sm:pl-0">
                      <p className="truncate text-[0.6875rem] text-ink/65">
                        {housingSummary(row)}
                      </p>
                      <p className="truncate text-[0.625rem] text-ink/40">
                        {row.hasOtherPets
                          ? row.otherPetsDetails || "Has other pets"
                          : "No other pets"}
                      </p>
                    </div>

                    <div className="pl-[3.25rem] text-[0.625rem] text-ink/55 sm:pl-0">
                      {keyDate(row)}
                    </div>

                    <div className="pl-[3.25rem] sm:pl-0">
                      <Badge tone={status.tone} surface="light">
                        {status.label}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pl-[3.25rem] sm:pl-0">
                      {primary && PrimaryIcon && (
                        <Button
                          size="xs"
                          variant={primary === "approve" ? "primary" : "tertiary"}
                          onClick={(event) => {
                            event.stopPropagation();
                            openAction(primary, row);
                          }}
                        >
                          <PrimaryIcon className="h-2.5 w-2.5" strokeWidth={2} />
                          {actionLabelFor(primary, row.status)}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(row.id);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="flex-wrap border-t border-ink/[0.07] px-4 py-3"
        />
      </section>
        </>
      ) : (
        <div className="mt-4">
          <AdoptionAnimalsList
            animals={animals}
            onViewApplications={(animalCode) => {
              const params = new URLSearchParams({ q: animalCode });
              router.push(`/admin/adoptions?${params.toString()}`, { scroll: false });
            }}
          />
        </div>
      )}

      {selected && (
        <AdoptionDetail
          request={selected}
          onClose={() => setSelectedId(null)}
          onAction={(kind) => openAction(kind, selected)}
        />
      )}

      <ConfirmDialog
        open={Boolean(dialog && activeRequest)}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        tone={dialogConfig.tone}
        confirmDisabled={dialogConfig.disabled}
        onConfirm={runAction}
      >
        {dialog?.kind === "interview" && (
          <div className="mb-3">
            <span className="text-[0.6875rem] font-medium text-ink/60">
              Interview date and time
            </span>
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
              <DatePicker
                name="interview-date"
                value={interviewAt ? interviewAt.slice(0, 10) : ""}
                min={todayInput()}
                onChange={(date) =>
                  setInterviewAt(
                    date
                      ? `${date}T${interviewTimeFor(date, interviewAt.slice(11, 16))}`
                      : "",
                  )
                }
                placeholder="Pick a date"
              />
              <TimePicker
                name="interview-time"
                value={interviewAt ? interviewAt.slice(11, 16) : ""}
                min={
                  !interviewAt || interviewAt.slice(0, 10) === todayInput()
                    ? currentTimeInput()
                    : undefined
                }
                onChange={(time) => {
                  if (!time) {
                    setInterviewAt(interviewAt.slice(0, 10));
                    return;
                  }
                  const date = interviewAt.slice(0, 10) || todayInput();
                  setInterviewAt(`${date}T${time}`);
                }}
                placeholder="Time"
              />
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-ink/[0.08] bg-ink/[0.02] px-2.5 py-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/35" strokeWidth={1.9} />
              <div className="min-w-0">
                <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
                  Venue
                </p>
                <p className="text-[0.75rem] font-medium text-ink/70">{INTERVIEW_VENUE}</p>
              </div>
            </div>
          </div>
        )}

        {dialog?.kind === "reject" && (
          <label className="mb-3 block">
            <span className="text-[0.6875rem] font-medium text-ink/60">
              Reason for rejection
            </span>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              maxLength={255}
              placeholder="Explain why this application cannot proceed."
              className="mt-1 w-full rounded-lg border border-ink/12 bg-white px-2.5 py-2 text-[0.75rem] text-ink placeholder:text-ink/35 focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>
        )}

        {dialog?.kind === "complete" && (
          <label className="mb-3 block">
            <span className="text-[0.6875rem] font-medium text-ink/60">Release date</span>
            <input
              type="date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-ink/12 bg-white px-2.5 text-[0.75rem] text-ink focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
          </label>
        )}

        {dialog?.kind === "followup" && (
          <div className="mb-3 grid gap-2.5">
            <label className="block">
              <span className="text-[0.6875rem] font-medium text-ink/60">Follow-up date</span>
              <input
                type="date"
                value={followupDate}
                onChange={(event) => setFollowupDate(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-ink/12 bg-white px-2.5 text-[0.75rem] text-ink focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20"
              />
            </label>
            <label className="block">
              <span className="text-[0.6875rem] font-medium text-ink/60">Method</span>
              <div className="mt-1">
                <Select
                  name="followup-method"
                  value={followupMethod}
                  onChange={(value) => setFollowupMethod(value as FollowupMethod)}
                  options={METHOD_OPTIONS}
                  size="compact"
                  className="w-full"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[0.6875rem] font-medium text-ink/60">
                Animal condition
              </span>
              <input
                type="text"
                value={followupCondition}
                onChange={(event) => setFollowupCondition(event.target.value)}
                maxLength={255}
                placeholder="Healthy, gaining weight, needs a vet…"
                className="mt-1 h-9 w-full rounded-lg border border-ink/12 bg-white px-2.5 text-[0.75rem] text-ink placeholder:text-ink/35 focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20"
              />
            </label>
            <label className="block">
              <span className="text-[0.6875rem] font-medium text-ink/60">Notes</span>
              <textarea
                value={followupRemarks}
                onChange={(event) => setFollowupRemarks(event.target.value)}
                rows={2}
                maxLength={5000}
                placeholder="Anything worth remembering about the visit."
                className="mt-1 w-full rounded-lg border border-ink/12 bg-white px-2.5 py-2 text-[0.75rem] text-ink placeholder:text-ink/35 focus:border-clay/50 focus:outline-none focus:ring-2 focus:ring-clay/20"
              />
            </label>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}

function dialogConfigFor(
  kind: AdoptionActionKind | undefined,
  request: AdoptionRow | null,
  values: {
    interviewAt: string;
    rejectReason: string;
    releaseDate: string;
    followupDate: string;
  },
): {
  title: string;
  description: string;
  confirmLabel: string;
  tone: ConfirmTone;
  disabled: boolean;
} {
  const animal = request?.animal.animalCode ?? "this animal";
  const code = request?.requestCode ?? "This application";

  switch (kind) {
    case "interview": {
      const reschedule = request?.status === "interview_scheduled";
      return {
        title: reschedule ? "Reschedule the interview" : "Schedule the interview",
        description: `${reschedule ? "Update" : "Set"} the meet-and-greet for ${code} and ${animal} at the ${INTERVIEW_VENUE}. The applicant is notified when the interview is saved.`,
        confirmLabel: reschedule ? "Update interview" : "Schedule interview",
        tone: "default",
        disabled: !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(values.interviewAt),
      };
    }
    case "approve":
      return {
        title: "Approve this applicant?",
        description: `${code} will be approved for ${animal}. The interview at the ${INTERVIEW_VENUE} must have taken place first. Other open applications for the same animal will be rejected automatically, and the animal moves to adoption pending.`,
        confirmLabel: "Approve applicant",
        tone: "success",
        disabled: false,
      };
    case "reject":
      return {
        title: "Reject this application?",
        description: `${code} will be closed and the applicant notified. This cannot be undone.`,
        confirmLabel: "Reject application",
        tone: "danger",
        disabled: values.rejectReason.trim().length < 3,
      };
    case "complete":
      return {
        title: "Complete this adoption?",
        description: `${animal} will be marked adopted and its public listing archived. Record the release date so the adoption history stays accurate.`,
        confirmLabel: "Complete adoption",
        tone: "success",
        disabled: !values.releaseDate,
      };
    case "followup":
      return {
        title: "Record a follow-up",
        description: `Log a post-adoption welfare check for ${animal}.`,
        confirmLabel: "Save follow-up",
        tone: "default",
        disabled: !values.followupDate,
      };
    case "review":
      return {
        title: "Start reviewing this application?",
        description: `${code} will move to under review so the team knows it is being handled.`,
        confirmLabel: "Start review",
        tone: "default",
        disabled: false,
      };
    default:
      return {
        title: "",
        description: "",
        confirmLabel: "Confirm",
        tone: "default",
        disabled: true,
      };
  }
}
