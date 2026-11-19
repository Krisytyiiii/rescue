"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

import type { AnimalRow } from "./animals-types";
import { HEART_RATE_RANGES, HEALTH_RECORD_TYPES } from "./animals-types";
import { humanize } from "./animals-utils";

export type HealthEntryKind = "record" | "vaccination" | "heart_rate";

/** Existing entry passed when the admin edits instead of adding. */
export interface HealthEntryEdit {
  id: string;
  kind: HealthEntryKind;
  values: Record<string, string>;
}

interface HealthEntryDialogProps {
  open: boolean;
  animal: AnimalRow;
  initialKind: HealthEntryKind;
  /** When set, the dialog edits this entry instead of creating a new one. */
  entry?: HealthEntryEdit;
  onClose: () => void;
  onSaved: () => void;
}

type Skipped = Record<HealthEntryKind, boolean>;
type Errors = Record<string, string>;

const STEPS: Array<{
  id: HealthEntryKind;
  label: string;
  hint: string;
  icon: typeof Stethoscope;
}> = [
  {
    id: "record",
    label: "Medical note",
    hint: "What the vet found and how it was treated.",
    icon: Stethoscope,
  },
  {
    id: "vaccination",
    label: "Vaccination",
    hint: "Which vaccine was given and when the next dose is due.",
    icon: Syringe,
  },
  {
    id: "heart_rate",
    label: "Heart rate",
    hint: "One resting reading is enough to complete the health check.",
    icon: HeartPulse,
  },
];

const CONTEXTS = [
  { value: "resting", label: "Resting" },
  { value: "during_exam", label: "During exam" },
  { value: "post_activity", label: "After activity" },
  { value: "under_stress", label: "Under stress" },
];

const manilaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const manilaTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Today's date in Manila as `yyyy-mm-dd`. */
function manilaToday() {
  return manilaDateFormatter.format(new Date());
}

/** The current Manila wall-clock time as `HH:mm`. */
function manilaNow() {
  return manilaTimeFormatter.format(new Date());
}

export function HealthEntryDialog({
  open,
  animal,
  initialKind,
  entry,
  onClose,
  onSaved,
}: HealthEntryDialogProps) {
  const editing = Boolean(entry);
  const formRef = useRef<HTMLFormElement>(null);
  const submitIntentRef = useRef(false);
  const toast = useToast();
  const [today, setToday] = useState("");
  const [nowTime, setNowTime] = useState("");
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState<Skipped>({
    record: false,
    vaccination: false,
    heart_rate: false,
  });

  const range = HEART_RATE_RANGES[animal.species];

  useEffect(() => {
    setToday(manilaToday());
    setNowTime(manilaNow());
  }, []);

  useEffect(() => {
    if (!open) return;
    // Refresh the clock every time the dialog opens so a long-lived console
    // never prefills a stale time.
    setToday(manilaToday());
    setNowTime(manilaNow());
    const index = STEPS.findIndex((item) => item.id === initialKind);
    setStep(index >= 0 ? index : 0);
    setErrors({});
    setError("");
    setSkipped({
      record: initialKind !== "record",
      vaccination: initialKind !== "vaccination",
      heart_rate: initialKind !== "heart_rate",
    });
  }, [open, initialKind, entry?.id]);

  // This dialog can sit on top of the animal drawer. Handle Escape here first
  // so closing the entry never dismisses the drawer underneath.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  function readValues(): FormData {
    return new FormData(formRef.current ?? undefined);
  }

  function hasData(kind: HealthEntryKind, data: FormData): boolean {
    const value = (key: string) => String(data.get(key) ?? "").trim();
    if (kind === "record") {
      return Boolean(
        value("diagnosis") ||
          value("treatment") ||
          value("medication") ||
          value("weightKg") ||
          value("followUpDate") ||
          value("remarks"),
      );
    }
    if (kind === "vaccination") return Boolean(value("vaccineName"));
    return Boolean(value("heartRateBpm"));
  }

  function validateStep(kind: HealthEntryKind, data: FormData): Errors {
    const found: Errors = {};
    const value = (key: string) => String(data.get(key) ?? "").trim();

    if (kind === "record") {
      if (!value("recordDate")) found.recordDate = "Choose the date of the visit.";
      if (!value("diagnosis") && !value("treatment")) {
        found.diagnosis = "Add what the vet found, or how it was treated.";
      }
      const weight = value("weightKg");
      if (weight) {
        const kg = Number(weight);
        if (!Number.isFinite(kg) || kg <= 0 || kg > 200) {
          found.weightKg = "Enter a weight between 0.1 and 200 kg.";
        }
      }
    }

    if (kind === "vaccination") {
      if (!value("vaccineName")) found.vaccineName = "Enter the vaccine name.";
      if (!value("dateGiven")) found.dateGiven = "Choose the date it was given.";
      const nextDue = value("nextDueDate");
      if (!editing && nextDue && nextDue < new Date().toISOString().slice(0, 10)) {
        found.nextDueDate = "The next dose must be a future date.";
      }
      const dose = value("doseNumber");
      if (dose && (!Number.isInteger(Number(dose)) || Number(dose) < 1)) {
        found.doseNumber = "Dose must be a whole number of 1 or more.";
      }
    }

    if (kind === "heart_rate") {
      const bpm = value("heartRateBpm");
      if (!bpm) found.heartRateBpm = "Enter the heart rate in bpm.";
      else {
        const rate = Number(bpm);
        if (!Number.isFinite(rate) || rate < 20 || rate > 400) {
          found.heartRateBpm = "Enter a rate between 20 and 400 bpm.";
        }
      }
      if (!value("measuredAt")) found.measuredAt = "Choose when it was measured.";
    }

    return found;
  }

  function advance(from: number) {
    setStep(Math.min(from + 1, STEPS.length - 1));
  }

  function handleNext() {
    const current = STEPS[step]!;
    const data = readValues();

    if (skipped[current.id] && !hasData(current.id, data)) {
      setErrors({});
      advance(step);
      return;
    }

    const found = validateStep(current.id, data);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSkipped((currentSkipped) => ({ ...currentSkipped, [current.id]: false }));
    setErrors({});
    advance(step);
  }

  function handleSkip() {
    const current = STEPS[step]!;
    setSkipped((currentSkipped) => ({ ...currentSkipped, [current.id]: true }));
    setErrors({});
    advance(step);
  }

  function handleBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submitIntentRef.current) return;
    submitIntentRef.current = false;

    const data = readValues();
    const included = editing
      ? STEPS.filter((item) => item.id === initialKind)
      : STEPS.filter((item) => !skipped[item.id] || hasData(item.id, data));

    if (included.length === 0) {
      setError("Add at least one health detail, or close the form.");
      return;
    }

    for (const item of included) {
      const found = validateStep(item.id, data);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(STEPS.findIndex((entry) => entry.id === item.id));
        setError("Please fix the highlighted fields before saving.");
        return;
      }
    }

    const payloads: Array<{ kind: HealthEntryKind; payload: Record<string, unknown> }> = [];

    for (const item of included) {
      const payload: Record<string, unknown> = { kind: item.id };
      for (const [key, value] of data.entries()) {
        if (typeof value === "string" && value.trim() !== "") payload[key] = value.trim();
      }

      // The form collects a date and a time separately. Combine them into a
      // real timestamp so logs keep the actual time of measurement instead of
      // defaulting to midnight.
      if (item.id === "heart_rate") {
        const date = String(payload.measuredAt ?? "");
        const time = String(payload.measuredTime ?? "");
        delete payload.measuredTime;
        if (date) {
          const stamp = new Date(`${date}T${time || "00:00"}:00+08:00`);
          if (!Number.isNaN(stamp.getTime())) {
            payload.measuredAt = stamp.toISOString();
          }
        }
      }

      payloads.push({ kind: item.id, payload });
    }

    // Close instantly; saves run in the background and report through a toast.
    onClose();
    setErrors({});
    setError("");

    try {
      await Promise.all(
        payloads.map(async ({ payload }) => {
          const response = await fetch(`/api/admin/animals/${animal.id}/health`, {
            method: editing && entry ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              editing && entry ? { ...payload, entryId: entry.id } : payload,
            ),
          });
          const json = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(json?.error?.message ?? "Something went wrong while saving");
          }
        }),
      );

      if (editing) {
        toast.success("Health detail updated", {
          description: `${animal.animalCode} now shows the updated record.`,
        });
      } else {
        const labels = included.map(
          (item) =>
            STEPS.find((step) => step.id === item.id)?.label.toLowerCase() ?? "health entry",
        );
        toast.success("Health details saved", {
          description: `${animal.animalCode} now has ${labels.join(", ")} on record.`,
        });
      }
      onSaved();
    } catch (submitError) {
      toast.error("Couldn't save the health details", {
        description: `${
          submitError instanceof Error ? submitError.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="health-entry-title"
      closeLabel="Close health form"
      eyebrow={`Health · ${animal.animalCode}`}
      title={editing ? "Edit health detail" : "Add health details"}
      meta={
        <span className="text-[0.6875rem] text-ink/45">
          {editing ? "Update the details below." : "Steps you skip can be added later."}
        </span>
      }
      panelClassName="sm:max-w-2xl"
    >
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        aria-labelledby="health-entry-title"
        onChange={(event) => {
          const name = (event.target as unknown as HTMLInputElement).name;
          if (!name) return;
          setErrors((current) => {
            if (!current[name]) return current;
            const next = { ...current };
            delete next[name];
            return next;
          });
        }}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (event.key === "Enter" && target.tagName === "INPUT") {
            event.preventDefault();
          }
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {!editing && (
        <div className="border-b border-ink/[0.07] px-4 py-3">
          <ol className="flex items-center gap-1.5">
            {STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex min-w-0 flex-1 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (index < step) {
                        setStep(index);
                        setErrors({});
                      }
                    }}
                    disabled={index > step}
                    aria-current={active ? "step" : undefined}
                    className={`flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors ${
                      index < step ? "cursor-pointer hover:bg-ink/[0.04]" : ""
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.5625rem] font-bold ${
                        done
                          ? "bg-moss text-white"
                          : active
                            ? "bg-ink text-paper"
                            : "bg-ink/[0.07] text-ink/35"
                      }`}
                    >
                      {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index + 1}
                    </span>
                    <span
                      className={`hidden truncate text-[0.6875rem] font-medium sm:block ${
                        active ? "text-ink" : done ? "text-ink/60" : "text-ink/35"
                      }`}
                    >
                      {item.label}
                    </span>
                    <Icon
                      className={`h-3 w-3 shrink-0 sm:hidden ${
                        active ? "text-ink" : "text-ink/35"
                      }`}
                      strokeWidth={1.9}
                    />
                  </button>
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`h-px min-w-2 flex-1 ${done ? "bg-moss/40" : "bg-ink/10"}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-4 py-4">
            <div>
              <h3 className="text-[0.8125rem] font-semibold text-ink">{current.label}</h3>
              <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/45">{current.hint}</p>
            </div>

            <FormAlert message={error} />

            <div className={current.id === "record" ? "block" : "hidden"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Record type" error={errors.recordType}>
                  <Select
                    name="recordType"
                    options={HEALTH_RECORD_TYPES.map((type) => ({
                      value: type,
                      label: humanize(type),
                    }))}
                    defaultValue={entry?.values.recordType ?? "checkup"}
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field label="Date of visit" error={errors.recordDate}>
                  <DatePicker
                    key={`record-${today}-${entry?.id ?? "new"}`}
                    name="recordDate"
                    defaultValue={entry?.values.recordDate ?? today}
                    placeholder="Pick a date"
                    invalid={Boolean(errors.recordDate)}
                    className="mt-1"
                  />
                </Field>
                <Field label="Diagnosis or findings" error={errors.diagnosis} className="sm:col-span-2">
                  <input
                    name="diagnosis"
                    defaultValue={entry?.values.diagnosis ?? ""}
                    maxLength={255}
                    className={`${inputClass} ${errors.diagnosis ? invalidClass : ""}`}
                  />
                </Field>
                <Field label="Treatment" className="sm:col-span-2">
                  <textarea
                    name="treatment"
                    rows={2}
                    defaultValue={entry?.values.treatment ?? ""}
                    className={`${inputClass} h-auto py-2`}
                  />
                </Field>
                <Field label="Medication">
                  <input
                    name="medication"
                    defaultValue={entry?.values.medication ?? ""}
                    maxLength={255}
                    className={inputClass}
                  />
                </Field>
                <Field label="Weight (kg)" error={errors.weightKg}>
                  <input
                    type="number"
                    name="weightKg"
                    min="0"
                    max="200"
                    step="0.01"
                    defaultValue={entry?.values.weightKg ?? ""}
                    className={inputClass}
                  />
                </Field>
                <Field label="Follow-up date">
                  <DatePicker
                    key={`follow-up-${today}-${entry?.id ?? "new"}`}
                    name="followUpDate"
                    defaultValue={entry?.values.followUpDate ?? ""}
                    placeholder="Not needed"
                    className="mt-1"
                  />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <textarea
                    name="remarks"
                    rows={2}
                    defaultValue={entry?.values.remarks ?? ""}
                    className={`${inputClass} h-auto py-2`}
                  />
                </Field>
              </div>
            </div>

            <div className={current.id === "vaccination" ? "block" : "hidden"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Vaccine name" error={errors.vaccineName} className="sm:col-span-2">
                  <input
                    name="vaccineName"
                    defaultValue={entry?.values.vaccineName ?? ""}
                    maxLength={100}
                    className={`${inputClass} ${errors.vaccineName ? invalidClass : ""}`}
                  />
                </Field>
                <Field label="Dose number" error={errors.doseNumber}>
                  <input
                    type="number"
                    name="doseNumber"
                    min="1"
                    defaultValue={entry?.values.doseNumber ?? ""}
                    className={`${inputClass} ${errors.doseNumber ? invalidClass : ""}`}
                  />
                </Field>
                <Field label="Date given" error={errors.dateGiven}>
                  <DatePicker
                    key={`given-${today}-${entry?.id ?? "new"}`}
                    name="dateGiven"
                    defaultValue={entry?.values.dateGiven ?? today}
                    placeholder="Pick a date"
                    invalid={Boolean(errors.dateGiven)}
                    className="mt-1"
                  />
                </Field>
                <Field label="Next dose due" error={errors.nextDueDate}>
                  <DatePicker
                    key={`due-${today}-${entry?.id ?? "new"}`}
                    name="nextDueDate"
                    defaultValue={entry?.values.nextDueDate ?? ""}
                    min={editing ? undefined : today}
                    placeholder="No next dose"
                    invalid={Boolean(errors.nextDueDate)}
                    className="mt-1"
                  />
                </Field>
                <Field label="Batch or lot number">
                  <input
                    name="batchLotNo"
                    defaultValue={entry?.values.batchLotNo ?? ""}
                    maxLength={40}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className={current.id === "heart_rate" ? "block" : "hidden"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Heart rate (bpm)" error={errors.heartRateBpm}>
                  <input
                    type="number"
                    name="heartRateBpm"
                    min="20"
                    max="400"
                    defaultValue={entry?.values.heartRateBpm ?? ""}
                    className={`${inputClass} ${errors.heartRateBpm ? invalidClass : ""}`}
                  />
                </Field>
                <Field label="Measured while">
                  <Select
                    name="measurementContext"
                    options={CONTEXTS}
                    defaultValue={entry?.values.measurementContext ?? "resting"}
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field label="Date measured" error={errors.measuredAt}>
                  <DatePicker
                    key={`measured-${today}-${entry?.id ?? "new"}`}
                    name="measuredAt"
                    defaultValue={entry?.values.measuredAt ?? today}
                    placeholder="Pick a date"
                    invalid={Boolean(errors.measuredAt)}
                    className="mt-1"
                  />
                </Field>
                <Field label="Time measured (optional)">
                  <input
                    type="time"
                    name="measuredTime"
                    key={`measured-time-${nowTime}-${entry?.id ?? "new"}`}
                    defaultValue={entry?.values.measuredTime || nowTime}
                    className={inputClass}
                  />
                </Field>
                <Field label="Notes">
                  <input
                    name="notes"
                    defaultValue={entry?.values.notes ?? ""}
                    maxLength={255}
                    className={inputClass}
                  />
                </Field>
                <p className="text-[0.625rem] leading-[1.5] text-ink/40 sm:col-span-2">
                  A healthy resting heart rate for a {animal.species} is {range.min}–{range.max}{" "}
                  bpm. Readings outside this range are flagged for you.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t border-ink/[0.07] bg-white px-4 py-3">
          {!editing && (
            <span className="hidden text-[0.6875rem] text-ink/40 sm:inline">
              Step {step + 1} of {STEPS.length}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={editing || step === 0 ? onClose : handleBack}
            >
              {editing || step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="h-3 w-3" strokeWidth={2} />
                  Back
                </>
              )}
            </Button>

            {!editing && !isLast && (
              <Button type="button" variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}

            {editing || isLast ? (
              <Button
                type="submit"
                onClick={() => {
                  submitIntentRef.current = true;
                }}
              >
                {editing ? "Save changes" : "Save health details"}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-3 w-3" strokeWidth={2} />
              </Button>
            )}
          </div>
        </div>
      </form>
    </OverlayCard>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[0.6875rem] font-medium text-ink/60">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-[0.625rem] font-medium text-[#b42318]">{error}</span>
      )}
    </label>
  );
}

const inputClass =
  "mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2.5 text-[0.75rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay focus:ring-2 focus:ring-clay/15";

const invalidClass = "border-[#b42318] focus:border-[#b42318] focus:ring-[#b42318]/15";
