"use client";

import {
  HeartPulse,
  Pencil,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/toast";

import type { AnimalHealthData, AnimalRow } from "./animals-types";
import { HEART_RATE_RANGES } from "./animals-types";
import { formatDate, formatDateTime, humanize } from "./animals-utils";
import type { HealthEntryEdit, HealthEntryKind } from "./health-entry-dialog";

const VACCINATION_TONES: Record<string, BadgeTone> = {
  completed: "success",
  due: "warning",
  overdue: "danger",
};

function clampPercent(value: number, min: number, max: number) {
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAdd,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <header className="flex items-center justify-between gap-3 border-b border-ink/[0.06] bg-[#fafaf9] px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05] text-ink/55 ring-1 ring-inset ring-ink/[0.04]">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[0.625rem] font-semibold uppercase tracking-[0.13em] text-ink/70">
              {title}
            </h3>
            <p className="mt-0.5 truncate text-[0.5625rem] text-ink/40">{subtitle}</p>
          </div>
        </div>
        <Button size="xs" variant="primary" onClick={onAdd} className="shrink-0">
          <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
          {actionLabel}
        </Button>
      </header>
      {children}
    </section>
  );
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      size="xs"
      variant="tertiary"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0"
    >
      <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
      Edit
    </Button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-baseline gap-1">
      <span className="shrink-0 text-[0.5313rem] uppercase tracking-[0.09em] text-ink/35">
        {label}
      </span>
      <span className="truncate text-[0.6563rem] text-ink/60">{value}</span>
    </span>
  );
}

export function AnimalHealthPanel({
  animal,
  onAddEntry,
  onEditEntry,
}: {
  animal: AnimalRow;
  onAddEntry: (kind: HealthEntryKind) => void;
  onEditEntry: (entry: HealthEntryEdit) => void;
}) {
  const toast = useToast();
  const [health, setHealth] = useState<AnimalHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const range = HEART_RATE_RANGES[animal.species];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/animals/${animal.id}/health`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? "Could not load health data");
      setHealth(json.data as AnimalHealthData);
    } catch (loadError) {
      toast.error("Couldn't load health details", {
        description: `${
          loadError instanceof Error ? loadError.message : "Something went wrong."
        } Please close this panel and try again.`,
      });
    } finally {
      setLoading(false);
    }
  }, [animal.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const records = health?.records ?? [];
  const vaccinations = health?.vaccinations ?? [];
  const heartRates = health?.heartRates ?? [];
  const latestHeartRate = heartRates[0];

  const rangeSpan = range.max - range.min;
  const domainMin = range.min - rangeSpan * 0.25;
  const domainMax = range.max + rangeSpan * 0.25;
  const inRangeStart = clampPercent(range.min, domainMin, domainMax);
  const inRangeWidth =
    clampPercent(range.max, domainMin, domainMax) - clampPercent(range.min, domainMin, domainMax);
  const markerPosition = latestHeartRate
    ? clampPercent(latestHeartRate.heartRateBpm, domainMin, domainMax)
    : 0;

  const nextDueVaccination = vaccinations
    .filter((vaccination) => vaccination.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate ?? "").getTime() - new Date(b.nextDueDate ?? "").getTime())[0];

  const latestRecord = records[0];

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white"
          >
            <div className="flex items-center gap-2.5 border-b border-ink/[0.06] bg-[#fafaf9] px-3.5 py-2.5">
              <span className="h-7 w-7 animate-pulse rounded-lg bg-ink/[0.06]" />
              <div className="space-y-1.5">
                <span className="block h-2 w-24 animate-pulse rounded-full bg-ink/[0.06]" />
                <span className="block h-1.5 w-32 animate-pulse rounded-full bg-ink/[0.04]" />
              </div>
            </div>
            <div className="space-y-2 px-3.5 py-3.5">
              <span className="block h-2 w-full animate-pulse rounded-full bg-ink/[0.04]" />
              <span className="block h-2 w-2/3 animate-pulse rounded-full bg-ink/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionCard
        icon={HeartPulse}
        title="Heart rate"
        subtitle={`Target ${range.min}–${range.max} bpm · ${heartRates.length} reading${
          heartRates.length === 1 ? "" : "s"
        }`}
        actionLabel="Log reading"
        onAdd={() => onAddEntry("heart_rate")}
      >
        <div className="px-3.5 pt-3">
          {latestHeartRate ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-display text-[2rem] leading-none text-ink tabular-nums">
                      {latestHeartRate.heartRateBpm}
                    </span>
                    <span className="mb-1 text-[0.6875rem] font-medium text-ink/40">bpm</span>
                    <Badge
                      tone={latestHeartRate.isFlagged ? "danger" : "success"}
                      surface="light"
                      className="mb-1"
                    >
                      {latestHeartRate.isFlagged ? "Flagged" : "In range"}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[0.625rem] text-ink/40">
                    Normal range {range.min}–{range.max} bpm
                    {latestHeartRate.measurementContext
                      ? ` · ${humanize(latestHeartRate.measurementContext)}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.5313rem] uppercase tracking-[0.09em] text-ink/35">
                    Last measured
                  </p>
                  <p className="mt-0.5 text-[0.6563rem] text-ink/60">
                    {formatDateTime(latestHeartRate.measuredAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="relative h-1.5 rounded-full bg-ink/[0.06]">
                  <div
                    className="absolute inset-y-0 rounded-full bg-[#15803d]/20"
                    style={{ left: `${inRangeStart}%`, width: `${inRangeWidth}%` }}
                  />
                  <span
                    className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${
                      latestHeartRate.isFlagged ? "bg-[#b42318]" : "bg-[#15803d]"
                    }`}
                    style={{ left: `${markerPosition}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[0.5313rem] text-ink/35">
                  <span>{range.min} bpm</span>
                  <span>{range.max} bpm</span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-ink/[0.1] px-3 py-5 text-center">
              <p className="text-[0.6875rem] font-medium text-ink/55">No readings yet</p>
              <p className="mt-0.5 text-[0.625rem] text-ink/35">
                Log a resting heart rate to start the baseline.
              </p>
            </div>
          )}
        </div>

        {heartRates.length > 0 && (
          <ScrollArea className="mt-3 max-h-44 border-t border-ink/[0.06]">
            <ul className="divide-y divide-ink/[0.05]">
              {heartRates.map((reading) => (
                <li
                  key={reading.id}
                  className="group flex items-center justify-between gap-3 px-3.5 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        reading.isFlagged ? "bg-[#b42318]" : "bg-[#15803d]/60"
                      }`}
                    />
                    <span
                      className={`truncate text-[0.6875rem] ${
                        reading.isFlagged
                          ? "font-semibold text-[#991b1b]"
                          : "text-ink/65"
                      }`}
                    >
                      {reading.heartRateBpm} bpm
                      {reading.measurementContext
                        ? ` · ${humanize(reading.measurementContext)}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[0.625rem] text-ink/35">
                      {formatDateTime(reading.measuredAt)}
                    </span>
                    <IconButton
                      label={`Edit heart rate reading of ${reading.heartRateBpm} bpm`}
                      onClick={() =>
                        onEditEntry({
                          id: reading.id,
                          kind: "heart_rate",
                          values: {
                            heartRateBpm: String(reading.heartRateBpm),
                            measurementContext: reading.measurementContext ?? "resting",
                            measuredAt: reading.measuredAt.slice(0, 10),
                            notes: reading.notes ?? "",
                          },
                        })
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </SectionCard>

      <SectionCard
        icon={Syringe}
        title="Vaccinations"
        subtitle={
          vaccinations.length === 0
            ? "No vaccinations recorded"
            : `${vaccinations.length} record${vaccinations.length === 1 ? "" : "s"}${
                nextDueVaccination
                  ? ` · next due ${formatDate(nextDueVaccination.nextDueDate as string)}`
                  : ""
              }`
        }
        actionLabel="Add vaccine"
        onAdd={() => onAddEntry("vaccination")}
      >
        {vaccinations.length === 0 ? (
          <div className="px-3.5 py-5 text-center">
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-ink/[0.04] text-ink/35">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="mt-2 text-[0.6875rem] font-medium text-ink/55">No vaccinations yet</p>
            <p className="mt-0.5 text-[0.625rem] text-ink/35">
              Add the first vaccine to keep the schedule on track.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink/[0.05]">
            {vaccinations.map((vaccination) => (
              <li
                key={vaccination.id}
                className="group flex items-start gap-3 px-3.5 py-3"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink/[0.04] text-ink/40">
                  <Syringe className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="min-w-0 truncate text-[0.75rem] font-medium text-ink/80">
                      {vaccination.vaccineName}
                    </p>
                    {vaccination.doseNumber ? (
                      <span className="rounded bg-ink/[0.05] px-1 py-0.5 text-[0.5625rem] font-semibold text-ink/45">
                        dose {vaccination.doseNumber}
                      </span>
                    ) : null}
                    <Badge
                      tone={VACCINATION_TONES[vaccination.status ?? "completed"] ?? "neutral"}
                      surface="light"
                      className="shrink-0"
                    >
                      {humanize(vaccination.status ?? "completed")}
                    </Badge>
                  </div>

                  <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                    <div>
                      <dt className="text-[0.5rem] uppercase tracking-[0.09em] text-ink/35">
                        Given
                      </dt>
                      <dd className="text-[0.625rem] text-ink/60">
                        {formatDate(vaccination.dateGiven)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.5rem] uppercase tracking-[0.09em] text-ink/35">
                        Next due
                      </dt>
                      <dd className="text-[0.625rem] text-ink/60">
                        {vaccination.nextDueDate
                          ? formatDate(vaccination.nextDueDate)
                          : "Not scheduled"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.5rem] uppercase tracking-[0.09em] text-ink/35">
                        Batch
                      </dt>
                      <dd className="truncate text-[0.625rem] text-ink/60">
                        {vaccination.batchLotNo || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <IconButton
                  label={`Edit ${vaccination.vaccineName}`}
                  onClick={() =>
                    onEditEntry({
                      id: vaccination.id,
                      kind: "vaccination",
                      values: {
                        vaccineName: vaccination.vaccineName,
                        doseNumber: vaccination.doseNumber
                          ? String(vaccination.doseNumber)
                          : "",
                        dateGiven: vaccination.dateGiven.slice(0, 10),
                        nextDueDate: vaccination.nextDueDate?.slice(0, 10) ?? "",
                        batchLotNo: vaccination.batchLotNo ?? "",
                      },
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        icon={Stethoscope}
        title="Past medical notes"
        subtitle={
          records.length === 0
            ? "No medical notes recorded"
            : `${records.length} note${records.length === 1 ? "" : "s"}${
                latestRecord ? ` · last ${formatDate(latestRecord.recordDate)}` : ""
              }`
        }
        actionLabel="Add note"
        onAdd={() => onAddEntry("record")}
      >
        {records.length === 0 ? (
          <div className="px-3.5 py-5 text-center">
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-ink/[0.04] text-ink/35">
              <Stethoscope className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="mt-2 text-[0.6875rem] font-medium text-ink/55">No medical notes yet</p>
            <p className="mt-0.5 text-[0.625rem] text-ink/35">
              Notes from checkups, treatments, and surgeries appear here.
            </p>
          </div>
        ) : (
          <ol className="relative m-3.5 space-y-2.5 before:absolute before:bottom-2 before:left-[3.5px] before:top-2 before:w-px before:bg-ink/[0.08]">
            {records.map((record) => (
              <li key={record.id} className="group relative pl-4">
                <span className="absolute left-0 top-2 h-2 w-2 rounded-full border-2 border-white bg-clay ring-1 ring-ink/10" />
                <div className="rounded-lg border border-ink/[0.07] bg-white p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.75rem] font-semibold text-ink/80">
                      {humanize(record.recordType)}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <p className="text-[0.5625rem] uppercase tracking-[0.06em] text-ink/35">
                        {formatDate(record.recordDate)}
                      </p>
                      <IconButton
                        label={`Edit ${humanize(record.recordType)} note`}
                        onClick={() =>
                          onEditEntry({
                            id: record.id,
                            kind: "record",
                            values: {
                              recordType: record.recordType,
                              recordDate: record.recordDate.slice(0, 10),
                              diagnosis: record.diagnosis ?? "",
                              treatment: record.treatment ?? "",
                              medication: record.medication ?? "",
                              weightKg: record.weightKg ?? "",
                              followUpDate: record.followUpDate?.slice(0, 10) ?? "",
                              remarks: record.remarks ?? "",
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  {record.diagnosis && (
                    <p className="mt-1 text-[0.6875rem] leading-[1.5] text-ink/60">
                      {record.diagnosis}
                    </p>
                  )}
                  {(record.treatment ||
                    record.medication ||
                    record.weightKg ||
                    record.followUpDate) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 border-t border-ink/[0.05] pt-1.5">
                      {record.treatment && <Field label="Treatment" value={record.treatment} />}
                      {record.medication && <Field label="Medication" value={record.medication} />}
                      {record.weightKg && <Field label="Weight" value={`${record.weightKg} kg`} />}
                      {record.followUpDate && (
                        <Field label="Follow-up" value={formatDate(record.followUpDate)} />
                      )}
                    </div>
                  )}
                  {record.remarks && (
                    <p className="mt-1.5 text-[0.625rem] leading-[1.5] text-ink/40">
                      {record.remarks}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}
