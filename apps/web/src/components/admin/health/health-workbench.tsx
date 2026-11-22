"use client";

/* eslint-disable @next/next/no-img-element */
import {
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Pencil,
  Plus,
  ShieldAlert,
  Stethoscope,
  Syringe,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverlayCard } from "@/components/ui/overlay-card";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { SecondaryTabFilters } from "@/components/ui/secondary-tab-filters";
import { StatCard } from "@/components/ui/stat-card";
import { TabFilters } from "@/components/ui/tab-filters";

import { AnimalHealthPanel } from "../animals/animal-health-panel";
import {
  HealthEntryDialog,
  type HealthEntryEdit,
  type HealthEntryKind,
} from "../animals/health-entry-dialog";
import type { AnimalRow } from "../animals/animals-types";
import { formatDate, formatDateTime, humanize } from "../animals/animals-utils";
import { healthAnimalName, vaccinationStatusFor } from "./health-data";
import type {
  HealthAnimalRow,
  HealthHeartRateRow,
  HealthRecordRow,
  HealthRecordType,
  HealthTab,
  HealthVaccinationRow,
  WatchItem,
  WatchReason,
} from "./health-types";

const PAGE_SIZE = 12;

const VACCINATION_TONES: Record<string, BadgeTone> = {
  completed: "success",
  due: "warning",
  overdue: "danger",
};

const RECORD_TONES: Record<HealthRecordType, BadgeTone> = {
  checkup: "success",
  illness: "danger",
  injury: "warning",
  treatment: "info",
  surgery: "danger",
  deworming: "info",
  spay_neuter: "success",
  other: "neutral",
};

const SPECIES_OPTIONS = [
  { value: "", label: "All species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
];

const VACCINATION_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "overdue", label: "Overdue" },
  { value: "due", label: "Due soon" },
  { value: "completed", label: "Completed" },
];

const RECORD_OPTIONS = [
  { value: "", label: "All record types" },
  { value: "checkup", label: "Checkup" },
  { value: "illness", label: "Illness" },
  { value: "injury", label: "Injury" },
  { value: "treatment", label: "Treatment" },
  { value: "surgery", label: "Surgery" },
  { value: "deworming", label: "Deworming" },
  { value: "spay_neuter", label: "Spay / neuter" },
  { value: "other", label: "Other" },
];

const REASON_OPTIONS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "due", label: "Due soon" },
  { id: "follow_up", label: "Follow-ups" },
  { id: "heart_flag", label: "Heart flags" },
  { id: "no_check", label: "No check" },
] as const;

const WATCH_META: Record<
  WatchReason,
  { tone: string; label: string; icon: typeof HeartPulse }
> = {
  overdue: { tone: "bg-[#b42318]", label: "Overdue", icon: Syringe },
  due: { tone: "bg-[#c99a4e]", label: "Due soon", icon: CalendarClock },
  follow_up: { tone: "bg-clay", label: "Follow-up", icon: ClipboardList },
  heart_flag: { tone: "bg-[#b42318]", label: "Heart flag", icon: HeartPulse },
  no_check: { tone: "bg-ink/30", label: "No check", icon: Stethoscope },
};

const WATCH_BADGE_TONES: Record<WatchReason, BadgeTone> = {
  overdue: "danger",
  due: "warning",
  follow_up: "info",
  heart_flag: "danger",
  no_check: "neutral",
};

interface HealthWorkbenchProps {
  animals: HealthAnimalRow[];
  records: HealthRecordRow[];
  vaccinations: HealthVaccinationRow[];
  heartRates: HealthHeartRateRow[];
  initialTab?: HealthTab;
  initialVaccinationStatus?: string;
  initialFlaggedOnly?: boolean;
}

function matches(haystack: Array<string | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.filter(Boolean).join(" ").toLowerCase().includes(needle);
}

const MANILA_DATE_INPUT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MANILA_TIME_INPUT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `yyyy-mm-dd` in Philippine time, matching how dates are displayed. */
function manilaDateInput(value: string): string {
  return MANILA_DATE_INPUT.format(new Date(value));
}

/** `HH:mm` in Philippine time for the edit form's time field. */
function manilaTimeInput(value: string): string {
  return MANILA_TIME_INPUT.format(new Date(value));
}

/**
 * Legacy readings were saved as date-only values at UTC midnight, which would
 * render as a fake "8:00 AM" in Manila. Show just the date for those instead of
 * inventing a time.
 */
function isDateOnlyMoment(value: string): boolean {
  const date = new Date(value);
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function displayMoment(value: string): string {
  return isDateOnlyMoment(value) ? formatDate(value) : formatDateTime(value);
}

function drawerAnimal(animal: HealthAnimalRow): AnimalRow {
  return {
    id: animal.id,
    animalCode: animal.animalCode,
    name: animal.name,
    species: animal.species,
    breedType: animal.breedType,
    sex: animal.sex,
    estimatedAgeMonths: animal.estimatedAgeMonths,
    size: null,
    colorMarkings: null,
    temperament: null,
    weightKg: animal.weightKg,
    isNeutered: false,
    microchipNo: null,
    originType: "rescue_report",
    lifecycleStatus: animal.lifecycleStatus,
    listingStatus: animal.listingStatus,
    intakeDate: null,
    adoptedDate: null,
    primaryPhotoUrl: animal.primaryPhotoUrl,
    model3dUrl: null,
    description: null,
    sourceReport: null,
    postedBy: null,
    media: [],
    healthRecords: [],
    vaccinations: [],
    hasHeartRate: false,
    createdAt: "",
    updatedAt: "",
  };
}

export function HealthWorkbench({
  animals,
  records,
  vaccinations,
  heartRates,
  initialTab = "watchlist",
  initialVaccinationStatus = "",
  initialFlaggedOnly = false,
}: HealthWorkbenchProps) {
  const router = useRouter();
  const [tab, setTab] = useState<HealthTab>(initialTab);
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("");
  const [vaccinationStatus, setVaccinationStatus] = useState(
    initialVaccinationStatus,
  );
  const [recordType, setRecordType] = useState("");
  const [reason, setReason] = useState<"all" | WatchReason>("all");
  const [flaggedOnly, setFlaggedOnly] = useState(initialFlaggedOnly);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entry, setEntry] = useState<{
    animal: HealthAnimalRow;
    kind: HealthEntryKind;
    edit?: HealthEntryEdit;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const underCare = useMemo(
    () =>
      animals.filter(
        (animal) =>
          animal.lifecycleStatus === "rescued" ||
          animal.lifecycleStatus === "under_care",
      ),
    [animals],
  );

  const counts = useMemo(() => {
    const horizon = Date.now() - 30 * 86_400_000;
    return {
      underCare: underCare.length,
      due: vaccinations.filter((item) => item.status === "due").length,
      overdue: vaccinations.filter((item) => item.status === "overdue").length,
      flagged: heartRates.filter(
        (reading) =>
          reading.isFlagged && new Date(reading.measuredAt).getTime() >= horizon,
      ).length,
    };
  }, [underCare, vaccinations, heartRates]);

  const watchItems = useMemo<WatchItem[]>(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const horizon = now.getTime() - 30 * 86_400_000;
    const items: WatchItem[] = [];

    for (const vaccination of vaccinations) {
      const status = vaccinationStatusFor(vaccination.nextDueDate);
      if (status !== "overdue" && status !== "due") continue;
      items.push({
        id: `vax-${vaccination.id}`,
        reason: status,
        animal: vaccination.animal,
        title: `${vaccination.vaccineName}${
          vaccination.doseNumber ? ` · dose ${vaccination.doseNumber}` : ""
        }`,
        detail:
          status === "overdue"
            ? `Overdue since ${formatDate(vaccination.nextDueDate)}.`
            : `Next dose is due ${formatDate(vaccination.nextDueDate)}.`,
        date: vaccination.nextDueDate,
        actionLabel: "Add dose",
        kind: "vaccination",
      });
    }

    for (const record of records) {
      if (!record.followUpDate) continue;
      if (record.followUpDate.slice(0, 10) > today) continue;
      items.push({
        id: `follow-${record.id}`,
        reason: "follow_up",
        animal: record.animal,
        title: `${humanize(record.recordType)} follow-up`,
        detail:
          record.diagnosis?.trim() ||
          `Follow-up scheduled ${formatDate(record.followUpDate)}.`,
        date: record.followUpDate,
        actionLabel: "Add visit",
        kind: "record",
      });
    }

    for (const reading of heartRates) {
      if (!reading.isFlagged) continue;
      if (new Date(reading.measuredAt).getTime() < horizon) continue;
      items.push({
        id: `hr-${reading.id}`,
        reason: "heart_flag",
        animal: reading.animal,
        title: `${reading.heartRateBpm} bpm`,
        detail: `${humanize(reading.measurementContext ?? "resting")} · measured ${displayMoment(
          reading.measuredAt,
        )}.`,
        date: reading.measuredAt,
        actionLabel: "Review",
        kind: "heart_rate",
      });
    }

    const checkedIds = new Set(records.map((record) => record.animalId));
    for (const animal of underCare) {
      if (checkedIds.has(animal.id)) continue;
      items.push({
        id: `none-${animal.id}`,
        reason: "no_check",
        animal,
        title: "No health check recorded",
        detail: "No medical visit, vaccination, or heart rate has been logged.",
        date: null,
        actionLabel: "Add checkup",
        kind: "record",
      });
    }

    const order: Record<WatchReason, number> = {
      overdue: 0,
      heart_flag: 1,
      follow_up: 2,
      due: 3,
      no_check: 4,
    };

    return items.sort((a, b) => {
      if (order[a.reason] !== order[b.reason]) {
        return order[a.reason] - order[b.reason];
      }
      return (a.date ?? "").localeCompare(b.date ?? "");
    });
  }, [vaccinations, records, heartRates, underCare]);

  const reasonCounts = useMemo(() => {
    const result: Record<"all" | WatchReason, number> = {
      all: watchItems.length,
      overdue: 0,
      due: 0,
      follow_up: 0,
      heart_flag: 0,
      no_check: 0,
    };
    for (const item of watchItems) {
      result[item.reason] += 1;
    }
    return result;
  }, [watchItems]);

  const filteredWatch = useMemo(
    () =>
      watchItems.filter(
        (item) =>
          (reason === "all" || item.reason === reason) &&
          (!species || item.animal.species === species) &&
          matches(
            [
              item.animal.animalCode,
              item.animal.name,
              item.title,
              item.detail,
            ],
            query,
          ),
      ),
    [watchItems, reason, species, query],
  );

  const filteredVaccinations = useMemo(
    () =>
      vaccinations.filter(
        (item) =>
          (!species || item.animal.species === species) &&
          (!vaccinationStatus || item.status === vaccinationStatus) &&
          matches(
            [
              item.animal.animalCode,
              item.animal.name,
              item.vaccineName,
              item.batchLotNo,
              item.administeredBy?.name,
            ],
            query,
          ),
      ),
    [vaccinations, species, vaccinationStatus, query],
  );

  const filteredRecords = useMemo(
    () =>
      records.filter(
        (item) =>
          (!species || item.animal.species === species) &&
          (!recordType || item.recordType === recordType) &&
          matches(
            [
              item.animal.animalCode,
              item.animal.name,
              item.diagnosis,
              item.treatment,
              item.medication,
              item.remarks,
              item.recordType,
            ],
            query,
          ),
      ),
    [records, species, recordType, query],
  );

  const filteredHeartRates = useMemo(
    () =>
      heartRates.filter(
        (item) =>
          (!species || item.animal.species === species) &&
          (!flaggedOnly || item.isFlagged) &&
          matches(
            [
              item.animal.animalCode,
              item.animal.name,
              item.notes,
              item.measurementContext,
            ],
            query,
          ),
      ),
    [heartRates, species, flaggedOnly, query],
  );

  const totalByTab: Record<HealthTab, number> = {
    watchlist: watchItems.length,
    vaccinations: vaccinations.length,
    records: records.length,
    heart_rate: heartRates.length,
  };

  const filteredByTab: Record<HealthTab, number> = {
    watchlist: filteredWatch.length,
    vaccinations: filteredVaccinations.length,
    records: filteredRecords.length,
    heart_rate: filteredHeartRates.length,
  };

  const total = filteredByTab[tab];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedWatch = filteredWatch.slice(start, start + PAGE_SIZE);
  const pagedVaccinations = filteredVaccinations.slice(start, start + PAGE_SIZE);
  const pagedRecords = filteredRecords.slice(start, start + PAGE_SIZE);
  const pagedHeartRates = filteredHeartRates.slice(start, start + PAGE_SIZE);

  const selected = selectedId
    ? (animals.find((animal) => animal.id === selectedId) ?? null)
    : null;

  const hasFilters = Boolean(
    query ||
      species ||
      vaccinationStatus ||
      recordType ||
      flaggedOnly ||
      reason !== "all",
  );

  function changeTab(next: HealthTab) {
    setTab(next);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setSpecies("");
    setVaccinationStatus("");
    setRecordType("");
    setReason("all");
    setFlaggedOnly(false);
    setPage(1);
  }

  function openCreate(animal: HealthAnimalRow, kind: HealthEntryKind) {
    setEntry({ animal, kind });
  }

  function openEdit(animal: HealthAnimalRow, edit: HealthEntryEdit) {
    setEntry({ animal, kind: edit.kind, edit });
  }

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Animals under care"
          value={counts.underCare}
          hint="Rescued or at the city vet"
          icon={Stethoscope}
          tone="moss"
          href="/admin/health?tab=watchlist"
        />
        <StatCard
          label="Vaccinations due"
          value={counts.due}
          hint="Next 7 days"
          icon={CalendarClock}
          tone="amber"
          href="/admin/health?tab=vaccinations&status=due"
        />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          hint="Past the due date"
          icon={ShieldAlert}
          tone="clay"
          href="/admin/health?tab=vaccinations&status=overdue"
        />
        <StatCard
          label="Flagged heart rate"
          value={counts.flagged}
          hint="Outside species range · 30 days"
          icon={HeartPulse}
          tone="forest"
          href="/admin/health?tab=heart_rate&flagged=1"
        />
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <TabFilters
              ariaLabel="Health sections"
              value={tab}
              onChange={changeTab}
              options={(
                [
                  { id: "watchlist", label: "Watchlist", icon: ClipboardList },
                  { id: "vaccinations", label: "Vaccinations", icon: Syringe },
                  { id: "records", label: "Medical records", icon: Stethoscope },
                  { id: "heart_rate", label: "Heart rate", icon: HeartPulse },
                ] as const
              ).map((option) => ({
                ...option,
                count: totalByTab[option.id],
              }))}
            />
          </div>

          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3 w-3" strokeWidth={2} />
            Add health entry
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-ink/[0.07] px-4 py-2.5">
          {tab === "vaccinations" && (
            <Select
              name="health-status"
              value={vaccinationStatus}
              onChange={(value) => {
                setVaccinationStatus(value);
                setPage(1);
              }}
              options={VACCINATION_OPTIONS}
              size="compact"
              className="w-36"
            />
          )}

          {tab === "records" && (
            <Select
              name="health-record-type"
              value={recordType}
              onChange={(value) => {
                setRecordType(value);
                setPage(1);
              }}
              options={RECORD_OPTIONS}
              size="compact"
              className="w-40"
            />
          )}

          {tab === "heart_rate" && (
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-ink/15 bg-white px-2.5 text-[0.75rem] font-medium text-ink/60">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(event) => {
                  setFlaggedOnly(event.target.checked);
                  setPage(1);
                }}
                className="h-3.5 w-3.5 accent-[#1f3d2b]"
              />
              Flagged only
            </label>
          )}

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
              placeholder="Search animal, vaccine, diagnosis…"
              className="w-full sm:w-64"
            />

            <Select
              name="health-species"
              value={species}
              onChange={(value) => {
                setSpecies(value);
                setPage(1);
              }}
              options={SPECIES_OPTIONS}
              size="compact"
              className="w-32"
            />
          </div>
        </div>

        {tab === "watchlist" && (
          <>
            <div className="border-b border-ink/[0.07] px-4 py-2">
              <SecondaryTabFilters
                ariaLabel="Watchlist reason"
                value={reason}
                onChange={(next) => {
                  setReason(next);
                  setPage(1);
                }}
                options={REASON_OPTIONS.map((option) => ({
                  ...option,
                  count: reasonCounts[option.id],
                }))}
              />
            </div>

            {pagedWatch.length > 0 && (
              <div className="hidden items-center gap-4 border-b border-ink/[0.06] bg-[#fafaf9] px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink/35 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_7rem_8rem_11rem]">
                <span>Animal</span>
                <span>Details</span>
                <span>When</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
            )}

            {pagedWatch.length === 0 ? (
              <SearchEmpty
                compact
                icon={watchItems.length === 0 ? ClipboardList : undefined}
                title={
                  watchItems.length === 0
                    ? "Nothing needs attention"
                    : "No cases match your filters"
                }
                description={
                  watchItems.length === 0
                    ? "Every animal under care is up to date."
                    : "Try another reason, species, or search term."
                }
                onClear={watchItems.length === 0 ? undefined : clearFilters}
                clearLabel="Clear filters"
              />
            ) : (
              <ul className="divide-y divide-ink/[0.06]">
                {pagedWatch.map((item) => (
                  <WatchRow
                    key={item.id}
                    item={item}
                    onOpen={() => setSelectedId(item.animal.id)}
                    onAction={() => {
                      if (item.reason === "heart_flag") {
                        setSelectedId(item.animal.id);
                        return;
                      }
                      openCreate(item.animal, item.kind);
                    }}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "vaccinations" &&
          (pagedVaccinations.length === 0 ? (
            <SearchEmpty
              compact
              icon={Syringe}
              title={
                vaccinations.length === 0
                  ? "No vaccinations recorded yet"
                  : "No vaccinations match your search"
              }
              description={
                vaccinations.length === 0
                  ? "Doses logged from an animal's health panel appear here."
                  : "Try another status, species, or search term."
              }
              onClear={vaccinations.length === 0 ? undefined : clearFilters}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              {pagedVaccinations.length > 0 && (
                <div className="hidden items-center gap-4 border-b border-ink/[0.06] bg-[#fafaf9] px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink/35 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_7rem_8rem_11rem]">
                  <span>Animal</span>
                  <span>Vaccine</span>
                  <span>Next due</span>
                  <span>Status</span>
                  <span className="text-right">Action</span>
                </div>
              )}
              <ul className="divide-y divide-ink/[0.06]">
                {pagedVaccinations.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-2 px-4 py-3 transition-colors hover:bg-ink/[0.015] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_7rem_8rem_11rem] sm:items-center sm:gap-4"
                  >
                    <AnimalIdentity animal={item.animal} onOpen={() => setSelectedId(item.animal.id)} />
                    <div className="min-w-0 pl-[3.25rem] sm:pl-0">
                      <p className="flex flex-wrap items-center gap-1.5 text-[0.75rem] font-medium text-ink/80">
                        {item.vaccineName}
                        {item.doseNumber ? (
                          <Badge tone="neutral" surface="light">
                            Dose {item.doseNumber}
                          </Badge>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[0.625rem] text-ink/45">
                        Given {formatDate(item.dateGiven)}
                        {item.batchLotNo ? ` · Batch ${item.batchLotNo}` : ""}
                        {item.administeredBy ? ` · ${item.administeredBy.name}` : ""}
                      </p>
                    </div>
                    <div className="pl-[3.25rem] text-[0.6875rem] text-ink/65 sm:pl-0">
                      {item.nextDueDate ? formatDate(item.nextDueDate) : "Not scheduled"}
                    </div>
                    <div className="pl-[3.25rem] sm:pl-0">
                      <Badge
                        tone={VACCINATION_TONES[item.status ?? "completed"] ?? "neutral"}
                        surface="light"
                      >
                        {humanize(item.status ?? "completed")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-end pl-[3.25rem] sm:pl-0">
                      <EditButton
                        label={`Edit ${item.vaccineName} for ${item.animal.animalCode}`}
                        onClick={() =>
                          openEdit(item.animal, {
                            id: item.id,
                            kind: "vaccination",
                            values: {
                              vaccineName: item.vaccineName,
                              doseNumber: item.doseNumber ? String(item.doseNumber) : "",
                              dateGiven: item.dateGiven.slice(0, 10),
                              nextDueDate: item.nextDueDate?.slice(0, 10) ?? "",
                              batchLotNo: item.batchLotNo ?? "",
                            },
                          })
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ))}

        {tab === "records" &&
          (pagedRecords.length === 0 ? (
            <SearchEmpty
              compact
              icon={Stethoscope}
              title={
                records.length === 0
                  ? "No medical records yet"
                  : "No records match your search"
              }
              description={
                records.length === 0
                  ? "Add a checkup after an animal arrives to start its history."
                  : "Try another record type, species, or search term."
              }
              onClear={records.length === 0 ? undefined : clearFilters}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              {pagedRecords.length > 0 && (
                <div className="hidden items-center gap-4 border-b border-ink/[0.06] bg-[#fafaf9] px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink/35 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_7rem_5rem]">
                  <span>Animal</span>
                  <span>Record</span>
                  <span>Weight</span>
                  <span className="text-right">Action</span>
                </div>
              )}
              <ul className="divide-y divide-ink/[0.06]">
                {pagedRecords.map((item) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const followUp = item.followUpDate
                    ? item.followUpDate.slice(0, 10) < today
                      ? "missed"
                      : "due"
                    : null;
                  return (
                    <li
                      key={item.id}
                      className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-ink/[0.015] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_7rem_5rem] sm:items-start sm:gap-4"
                    >
                      <AnimalIdentity
                        animal={item.animal}
                        onOpen={() => setSelectedId(item.animal.id)}
                      />

                      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            tone={RECORD_TONES[item.recordType] ?? "neutral"}
                            surface="light"
                          >
                            {humanize(item.recordType)}
                          </Badge>
                          {followUp && (
                            <Badge
                              tone={followUp === "missed" ? "danger" : "warning"}
                              surface="light"
                            >
                              {followUp === "missed"
                                ? "Follow-up missed"
                                : "Follow-up due"}
                            </Badge>
                          )}
                          {item.heartRates.length > 0 && (
                            <Badge tone="info" surface="light">
                              {item.heartRates.length}{" "}
                              {item.heartRates.length === 1 ? "reading" : "readings"}
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1.5 text-[0.8125rem] font-semibold leading-snug text-ink/85">
                          {item.diagnosis || "No diagnosis recorded"}
                        </p>

                        {(item.treatment || item.medication) && (
                          <dl className="mt-1.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                            {item.treatment && (
                              <div className="min-w-0">
                                <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink/35">
                                  Treatment
                                </dt>
                                <dd className="line-clamp-2 text-[0.6875rem] leading-[1.5] text-ink/60">
                                  {item.treatment}
                                </dd>
                              </div>
                            )}
                            {item.medication && (
                              <div className="min-w-0">
                                <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-ink/35">
                                  Medication
                                </dt>
                                <dd className="line-clamp-2 text-[0.6875rem] leading-[1.5] text-ink/60">
                                  {item.medication}
                                </dd>
                              </div>
                            )}
                          </dl>
                        )}

                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.625rem] text-ink/40">
                          <span>Recorded {formatDate(item.recordDate)}</span>
                          {item.followUpDate && (
                            <span>Follow-up {formatDate(item.followUpDate)}</span>
                          )}
                          <span>{item.attendedBy?.name ?? "Staff not recorded"}</span>
                        </p>
                      </div>

                      <div className="pl-[3.25rem] text-[0.6875rem] tabular-nums text-ink/65 sm:pl-0">
                        {item.weightKg ? `${Number(item.weightKg).toFixed(2)} kg` : "—"}
                      </div>

                      <div className="flex items-center justify-end pl-[3.25rem] sm:pl-0">
                        <EditButton
                          label={`Edit ${humanize(item.recordType)} for ${item.animal.animalCode}`}
                          onClick={() =>
                            openEdit(item.animal, {
                              id: item.id,
                              kind: "record",
                              values: {
                                recordType: item.recordType,
                                recordDate: item.recordDate.slice(0, 10),
                                diagnosis: item.diagnosis ?? "",
                                treatment: item.treatment ?? "",
                                medication: item.medication ?? "",
                                weightKg: item.weightKg ?? "",
                                followUpDate: item.followUpDate?.slice(0, 10) ?? "",
                                remarks: item.remarks ?? "",
                              },
                            })
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

        {tab === "heart_rate" &&
          (pagedHeartRates.length === 0 ? (
            <SearchEmpty
              compact
              icon={HeartPulse}
              title={
                heartRates.length === 0
                  ? "No heart-rate readings yet"
                  : "No readings match your search"
              }
              description={
                heartRates.length === 0
                  ? "Log a resting heart rate from an animal's health panel."
                  : "Try turning off the flagged filter or clearing the search."
              }
              onClear={heartRates.length === 0 ? undefined : clearFilters}
              clearLabel="Clear filters"
            />
          ) : (
            <>
              {pagedHeartRates.length > 0 && (
                <div className="hidden items-center gap-4 border-b border-ink/[0.06] bg-[#fafaf9] px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-ink/35 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_10rem_5rem]">
                  <span>Animal</span>
                  <span>Reading</span>
                  <span>Result</span>
                  <span className="text-right">Action</span>
                </div>
              )}
              <ul className="divide-y divide-ink/[0.06]">
                {pagedHeartRates.map((item) => {
                  const range = { dog: { min: 60, max: 140 }, cat: { min: 140, max: 220 } }[
                    item.animal.species
                  ];
                  return (
                    <li
                      key={item.id}
                      className="grid gap-2 px-4 py-3 transition-colors hover:bg-ink/[0.015] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_10rem_5rem] sm:items-center sm:gap-4"
                    >
                      <AnimalIdentity animal={item.animal} onOpen={() => setSelectedId(item.animal.id)} />
                      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
                        <p className="text-[0.75rem] font-medium text-ink/80">
                          {humanize(item.measurementContext ?? "resting")}
                          {item.notes ? ` · ${item.notes}` : ""}
                        </p>
                        <p className="mt-0.5 text-[0.625rem] text-ink/45">
                          Measured {displayMoment(item.measuredAt)} · expected {range.min}–
                          {range.max} bpm
                        </p>
                      </div>
                      <div className="pl-[3.25rem] sm:pl-0">
                        <Badge
                          tone={item.isFlagged ? "danger" : "success"}
                          surface="light"
                        >
                          {item.heartRateBpm} bpm ·{" "}
                          {item.isFlagged ? "Flagged" : "Normal"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-end pl-[3.25rem] sm:pl-0">
                        <EditButton
                          label={`Edit ${item.heartRateBpm} bpm reading for ${item.animal.animalCode}`}
                          onClick={() =>
                            openEdit(item.animal, {
                              id: item.id,
                              kind: "heart_rate",
                              values: {
                                heartRateBpm: String(item.heartRateBpm),
                                measurementContext: item.measurementContext ?? "resting",
                                measuredAt: manilaDateInput(item.measuredAt),
                                measuredTime: isDateOnlyMoment(item.measuredAt)
                                  ? ""
                                  : manilaTimeInput(item.measuredAt),
                                notes: item.notes ?? "",
                              },
                            })
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="flex-wrap border-t border-ink/[0.07] px-4 py-3"
        />
      </section>

      {selected && (
        <HealthDrawer
          animal={selected}
          onClose={() => setSelectedId(null)}
          onAddEntry={(kind) => openCreate(selected, kind)}
          onEditEntry={(edit) => openEdit(selected, edit)}
        />
      )}

      {entry && (
        <HealthEntryDialog
          open
          animal={drawerAnimal(entry.animal)}
          initialKind={entry.kind}
          entry={entry.edit}
          onClose={() => setEntry(null)}
          onSaved={() => router.refresh()}
        />
      )}

      {pickerOpen && (
        <AnimalPickerDialog
          animals={underCare.length ? underCare : animals}
          onClose={() => setPickerOpen(false)}
          onPick={(animal) => {
            setPickerOpen(false);
            openCreate(animal, "record");
          }}
        />
      )}
    </>
  );
}

function AnimalIdentity({
  animal,
  onOpen,
}: {
  animal: HealthAnimalRow;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-[10.5rem] max-w-[16rem] items-center gap-2.5 rounded-md text-left transition-colors hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
    >
      {animal.primaryPhotoUrl ? (
        <img
          src={animal.primaryPhotoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink/[0.05] text-ink/30">
          <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[0.6875rem] font-semibold text-ink/80">
          {healthAnimalName(animal)}
        </span>
        <span className="block truncate font-mono text-[0.625rem] text-ink/40">
          {animal.animalCode} · {humanize(animal.species)}
        </span>
      </span>
    </button>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="xs" variant="tertiary" onClick={onClick} aria-label={label} title={label}>
      <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
      Edit
    </Button>
  );
}

function WatchRow({
  item,
  onOpen,
  onAction,
}: {
  item: WatchItem;
  onOpen: () => void;
  onAction: () => void;
}) {
  const meta = WATCH_META[item.reason];
  const Icon = meta.icon;

  return (
    <li className="grid gap-2 px-4 py-3 transition-colors hover:bg-ink/[0.015] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)_7rem_8rem_11rem] sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`h-8 w-1 shrink-0 rounded-full ${meta.tone}`}
          aria-hidden="true"
        />
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink/[0.04] text-ink/45">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
        <AnimalIdentity animal={item.animal} onOpen={onOpen} />
      </div>

      <div className="min-w-0 pl-[3.25rem] sm:pl-0">
        <p className="text-[0.6875rem] font-semibold text-ink/80">{item.title}</p>
        <p className="mt-0.5 text-[0.625rem] leading-[1.5] text-ink/45">
          {item.detail}
        </p>
      </div>

      <div className="pl-[3.25rem] text-[0.625rem] text-ink/45 sm:pl-0">
        {item.date ? formatDate(item.date) : "—"}
      </div>

      <div className="pl-[3.25rem] sm:pl-0">
        <Badge tone={WATCH_BADGE_TONES[item.reason]} surface="light">
          {meta.label}
        </Badge>
      </div>

      <div className="flex items-center justify-end pl-[3.25rem] sm:pl-0">
        <Button size="xs" variant="tertiary" onClick={onAction}>
          <Plus className="h-2.5 w-2.5" strokeWidth={2} />
          {item.actionLabel}
        </Button>
      </div>
    </li>
  );
}

function HealthDrawer({
  animal,
  onClose,
  onAddEntry,
  onEditEntry,
}: {
  animal: HealthAnimalRow;
  onClose: () => void;
  onAddEntry: (kind: HealthEntryKind) => void;
  onEditEntry: (edit: HealthEntryEdit) => void;
}) {
  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="health-drawer-title"
      closeLabel="Close health details"
      eyebrow={`Health · ${animal.animalCode}`}
      title={healthAnimalName(animal)}
      meta={
        <span className="text-[0.6875rem] text-ink/45">
          {humanize(animal.lifecycleStatus)} · {humanize(animal.breedType)}
        </span>
      }
      panelClassName="sm:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/admin/animals?focus=${animal.id}`}
            className="text-[0.75rem] font-medium text-ink/50 transition-colors hover:text-clay"
          >
            Open animal profile
          </Link>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="info" surface="light">
              {humanize(animal.species)}
            </Badge>
            <Badge tone={animal.lifecycleStatus === "available" ? "success" : "progress"} surface="light">
              {humanize(animal.lifecycleStatus)}
            </Badge>
            {animal.weightKg && (
              <span className="text-[0.625rem] text-ink/45">
                {Number(animal.weightKg).toFixed(2)} kg
              </span>
            )}
          </div>
          <AnimalHealthPanel
            animal={drawerAnimal(animal)}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
          />
        </div>
      </ScrollArea>
    </OverlayCard>
  );
}

function AnimalPickerDialog({
  animals,
  onClose,
  onPick,
}: {
  animals: HealthAnimalRow[];
  onClose: () => void;
  onPick: (animal: HealthAnimalRow) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = animals.filter((animal) =>
    matches([animal.animalCode, animal.name, animal.breedType], query),
  );

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="health-picker-title"
      closeLabel="Close animal picker"
      eyebrow="Add health entry"
      title="Choose an animal"
      meta={
        <span className="text-[0.6875rem] text-ink/45">
          The record is saved to this animal.
        </span>
      }
      panelClassName="sm:max-w-lg"
    >
      <div className="border-b border-ink/[0.07] px-4 py-3">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search by code, name, or breed…"
        />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {filtered.length === 0 ? (
          <SearchEmpty compact title="No animals match your search" />
        ) : (
          <ul className="divide-y divide-ink/[0.06]">
            {filtered.map((animal) => (
              <li key={animal.id}>
                <button
                  type="button"
                  onClick={() => onPick(animal)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink/[0.02]"
                >
                  {animal.primaryPhotoUrl ? (
                    <img
                      src={animal.primaryPhotoUrl}
                      alt=""
                      className="h-8 w-8 rounded-md object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-ink/[0.05] text-ink/30">
                      <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.75rem] font-medium text-ink/80">
                      {healthAnimalName(animal)}
                    </span>
                    <span className="block truncate text-[0.625rem] text-ink/40">
                      {animal.animalCode} · {humanize(animal.species)} ·{" "}
                      {humanize(animal.breedType)}
                    </span>
                  </span>
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink/35">
                    {humanize(animal.lifecycleStatus)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </OverlayCard>
  );
}
