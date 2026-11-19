"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  PawPrint,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

import type {
  AnimalDraft,
  AnimalSpecies,
  OriginType,
  RescueReportOption,
} from "./animals-types";

interface AnimalIntakeDialogProps {
  open: boolean;
  onClose: () => void;
  /** Inserts an optimistic card immediately, before the save finishes. */
  onCreated: (draft: AnimalDraft, pendingKey: string) => void;
  /** Confirms or rolls back the optimistic card. */
  onSettled: (pendingKey: string, saved: boolean) => void;
  /** Rescued reports that can be linked to the new animal. */
  rescueReports?: RescueReportOption[];
}

const SPECIES = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
];
const BREEDS = [
  { value: "aspin", label: "Aspin" },
  { value: "puspin", label: "Puspin" },
  { value: "mixed", label: "Mixed breed" },
  { value: "other", label: "Other" },
];
const SEXES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Not sure yet" },
];
const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const ORIGINS = [
  { value: "rescue_report", label: "From a rescue report" },
  { value: "surrender", label: "Given up by an owner" },
  { value: "born_in_care", label: "Born while in care" },
  { value: "community_post", label: "Posted by the community" },
];

const STEPS = [
  {
    id: "basics",
    label: "The basics",
    hint: "Where it came from, species, breed, name, and sex.",
  },
  {
    id: "health",
    label: "Health and appearance",
    hint: "Age, weight, size, and identifying marks.",
  },
  {
    id: "intake",
    label: "Photo and notes",
    hint: "One photo and anything else the care team should know.",
  },
];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type Errors = Record<string, string>;

export function AnimalIntakeDialog({
  open,
  onClose,
  onCreated,
  onSettled,
  rescueReports = [],
}: AnimalIntakeDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitIntentRef = useRef(false);
  const toast = useToast();
  const [today, setToday] = useState("");
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const hasRescueReports = rescueReports.length > 0;
  const originOptions = hasRescueReports
    ? ORIGINS
    : ORIGINS.filter((option) => option.value !== "rescue_report");
  const [origin, setOrigin] = useState<OriginType>(
    hasRescueReports ? "rescue_report" : "surrender",
  );
  const [species, setSpecies] = useState<AnimalSpecies>("dog");
  const [selectedReport, setSelectedReport] = useState<RescueReportOption | null>(null);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    setErrors({});
    setStep(0);
    setOrigin(hasRescueReports ? "rescue_report" : "surrender");
    setSpecies("dog");
    setSelectedReport(null);
    setReportPhotoUrl(null);
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.preview);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }, [open, hasRescueReports]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.preview);
    };
  }, [photo]);

  if (!open) return null;

  function readValues(): FormData {
    return new FormData(formRef.current ?? undefined);
  }

  function validateStep(index: number, data: FormData): Errors {
    const found: Errors = {};
    const value = (key: string) => String(data.get(key) ?? "").trim();

    if (index === 0) {
      if (!value("species")) found.species = "Choose a species.";
      if (!value("breedType")) found.breedType = "Choose a breed.";
      if (!value("sex")) found.sex = "Choose a sex.";
      if (value("name").length > 60) found.name = "Keep the name under 60 characters.";

      if (!value("originType")) found.originType = "Choose where the animal came from.";
      const intakeDate = value("intakeDate");
      if (!intakeDate) found.intakeDate = "Choose the date it arrived.";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(intakeDate)) {
        found.intakeDate = "Use a valid date.";
      }
    }

    if (index === 1) {
      const age = value("estimatedAgeMonths");
      if (age) {
        const months = Number(age);
        if (!Number.isInteger(months) || months < 0 || months > 600) {
          found.estimatedAgeMonths = "Enter a whole number between 0 and 600 months.";
        }
      }
      const weight = value("weightKg");
      if (weight) {
        const kg = Number(weight);
        if (!Number.isFinite(kg) || kg <= 0 || kg > 200) {
          found.weightKg = "Enter a weight between 0.1 and 200 kg.";
        }
      }
      if (!value("size")) found.size = "Choose a size.";
    }

    return found;
  }

  function handleNext() {
    const found = validateStep(step, readValues());
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function handleBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleFile(file: File | undefined) {
    setErrors((current) => ({ ...current, photo: "" }));
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((current) => ({ ...current, photo: "Use a JPG, PNG, or WebP image." }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: "Images must be 5 MB or smaller." }));
      return;
    }
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhoto({ file, preview: URL.createObjectURL(file) });
  }

  function removePhoto() {
    if (photo) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setReportPhotoUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Picks or clears the rescue report the animal is being created from. */
  function chooseReport(report: RescueReportOption) {
    if (selectedReport?.id === report.id) {
      setSelectedReport(null);
      setReportPhotoUrl(null);
      return;
    }

    setSelectedReport(report);
    setReportPhotoUrl((current) => {
      if (photo) return current;
      return report.photoUrl;
    });
    if (report.species === "dog" || report.species === "cat") {
      setSpecies(report.species);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only the final "Save animal" button may submit. This blocks the browser's
    // implicit submission (pressing Enter in a field) from saving mid-form.
    if (!submitIntentRef.current) return;
    submitIntentRef.current = false;
    const data = readValues();

    for (let index = 0; index < STEPS.length; index += 1) {
      const found = validateStep(index, data);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(index);
        setError("Please fix the highlighted fields before saving.");
        return;
      }
    }

    const text = (key: string) => {
      const raw = String(data.get(key) ?? "").trim();
      return raw || undefined;
    };
    const number = (key: string) => {
      const raw = text(key);
      return raw === undefined ? undefined : Number(raw);
    };

    const draft = {
      name: text("name"),
      species: (text("species") ?? "dog") as AnimalSpecies,
      breedType: text("breedType") ?? "aspin",
      sex: text("sex") ?? "unknown",
      estimatedAgeMonths: number("estimatedAgeMonths"),
      size: text("size"),
      colorMarkings: text("colorMarkings"),
      temperament: text("temperament"),
      weightKg: number("weightKg"),
      isNeutered: data.get("isNeutered") === "on",
      microchipNo: text("microchipNo"),
      originType: (text("originType") ?? "rescue_report") as OriginType,
      sourceReportId:
        origin === "rescue_report" && selectedReport ? selectedReport.id : undefined,
      intakeDate: text("intakeDate"),
      description: text("description"),
      photoUrl: photo?.preview ?? reportPhotoUrl ?? undefined,
    };

    // Close instantly and show the animal in the list right away; the upload
    // and save continue in the background and report through a toast.
    const pendingKey = `pending-${Date.now()}`;
    onCreated(draft, pendingKey);
    onClose();
    setError("");
    setErrors({});
    setStep(0);

    try {
      let photoUrl: string | undefined;
      if (photo) {
        const upload = new FormData();
        upload.append("file", photo.file);
        const uploadResponse = await fetch("/api/admin/animals/upload", {
          method: "POST",
          body: upload,
        });
        const uploadJson = await uploadResponse.json().catch(() => null);
        if (!uploadResponse.ok) {
          throw new Error(uploadJson?.error?.message ?? "The photo couldn't be uploaded");
        }
        photoUrl = uploadJson.data.url as string;
      } else if (reportPhotoUrl) {
        photoUrl = reportPhotoUrl;
      }

      const payload = {
        name: draft.name,
        species: draft.species,
        breedType: draft.breedType,
        sex: draft.sex,
        estimatedAgeMonths: draft.estimatedAgeMonths,
        size: draft.size,
        colorMarkings: draft.colorMarkings,
        temperament: draft.temperament,
        weightKg: draft.weightKg,
        isNeutered: draft.isNeutered,
        microchipNo: draft.microchipNo,
        originType: draft.originType,
        sourceReportId: draft.sourceReportId,
        intakeDate: draft.intakeDate,
        description: draft.description,
        ...(photoUrl ? { media: [{ mediaType: "photo", fileUrl: photoUrl }] } : {}),
      };

      const response = await fetch("/api/admin/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Something went wrong while saving");
      }

      toast.success("Animal added", {
        description: `${payload.name ?? "The new animal"} is now in the list as ${
          json?.data?.animalCode ?? "a new record"
        }. Open its profile to add health notes.`,
      });
      onSettled(pendingKey, true);
    } catch (submitError) {
      onSettled(pendingKey, false);
      toast.error("Couldn't add the animal", {
        description: `${
          submitError instanceof Error ? submitError.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="animal-intake-title"
      closeLabel="Close add animal form"
      eyebrow="New animal"
      title="Add a rescued animal"
      meta={
        <span className="text-[0.6875rem] text-ink/45">
          A unique animal code is created when you save.
        </span>
      }
      panelClassName="sm:max-w-2xl"
    >
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (event.key === "Enter" && target.tagName === "INPUT") {
            event.preventDefault();
          }
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b border-ink/[0.07] px-4 py-3">
          <ol className="flex items-center gap-1.5">
            {STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
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
                      className={`truncate text-[0.6875rem] font-medium ${
                        active ? "text-ink" : done ? "text-ink/60" : "text-ink/35"
                      }`}
                    >
                      {item.label}
                    </span>
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

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-4 py-4">
            <div>
              <h3 className="text-[0.8125rem] font-semibold text-ink">
                {STEPS[step]!.label}
              </h3>
              <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/45">
                {STEPS[step]!.hint}
              </p>
            </div>

            <FormAlert message={error} />

            <div className={step === 0 ? "block" : "hidden"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Where it came from" error={errors.originType}>
                  <Select
                    name="originType"
                    value={origin}
                    onChange={(value) => setOrigin(value as OriginType)}
                    options={originOptions}
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field label="Date it arrived" error={errors.intakeDate}>
                  <DatePicker
                    key={today}
                    name="intakeDate"
                    defaultValue={today}
                    placeholder="Pick a date"
                    invalid={Boolean(errors.intakeDate)}
                    className="mt-1"
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Species" error={errors.species} hint="Dogs and cats only for now.">
                  <Select
                    name="species"
                    value={species}
                    onChange={(value) => setSpecies(value as AnimalSpecies)}
                    options={SPECIES}
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field label="Breed" error={errors.breedType}>
                  <Select
                    name="breedType"
                    options={BREEDS}
                    defaultValue="aspin"
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field
                  label="Name"
                  error={errors.name}
                  hint="Leave blank if the animal is not named yet."
                >
                  <input
                    name="name"
                    maxLength={60}
                    className={inputClass}
                    placeholder="e.g. Bunso"
                  />
                </Field>
                <Field label="Sex" error={errors.sex}>
                  <Select
                    name="sex"
                    options={SEXES}
                    defaultValue="unknown"
                    size="compact"
                    className="mt-1"
                  />
                </Field>
              </div>

              {hasRescueReports && origin === "rescue_report" && (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[0.6875rem] font-medium text-ink/60">
                      Rescued reports
                    </p>
                    <span className="text-[0.625rem] text-ink/35">
                      {rescueReports.length} waiting for intake
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.625rem] text-ink/40">
                    Pick the rescue case this animal came from. Only reports marked
                    rescued and not yet added are shown.
                  </p>

                  <ScrollArea className="mt-2 max-h-64 rounded-lg border border-ink/[0.08]">
                    <ul className="grid gap-2 p-2 sm:grid-cols-2">
                      {rescueReports.map((report) => {
                        const isSelected = selectedReport?.id === report.id;
                        const place = [report.barangayName, report.locationLandmark]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <li key={report.id}>
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => chooseReport(report)}
                              className={`flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition-colors ${
                                isSelected
                                  ? "border-clay bg-clay/[0.05]"
                                  : "border-ink/[0.08] bg-white hover:border-ink/20"
                              }`}
                            >
                              {report.photoUrl ? (
                                <img
                                  src={report.photoUrl}
                                  alt={`Photo from ${report.reportCode}`}
                                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                                />
                              ) : (
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-ink/[0.05] text-ink/30">
                                  <PawPrint className="h-4 w-4" strokeWidth={1.8} />
                                </span>
                              )}

                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-[0.625rem] font-semibold text-ink/70">
                                    {report.reportCode}
                                  </span>
                                  <span className="rounded bg-[#1f7a4d]/10 px-1 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.06em] text-[#1f7a4d]">
                                    Rescued
                                  </span>
                                </span>
                                <span className="mt-0.5 line-clamp-2 block text-[0.625rem] leading-[1.4] text-ink/50">
                                  {report.description}
                                </span>
                                <span className="mt-1 flex items-center gap-1 text-[0.5625rem] text-ink/35">
                                  <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.9} />
                                  <span className="truncate">
                                    {place || "Location not recorded"}
                                  </span>
                                </span>
                              </span>

                              {isSelected && (
                                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-clay text-white">
                                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className={step === 1 ? "block" : "hidden"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Approximate age"
                  error={errors.estimatedAgeMonths}
                  hint="In months — an estimate is fine."
                >
                  <input
                    type="number"
                    name="estimatedAgeMonths"
                    min="0"
                    max="600"
                    step="1"
                    className={inputClass}
                    placeholder="e.g. 18"
                  />
                </Field>
                <Field label="Weight (kg)" error={errors.weightKg}>
                  <input
                    type="number"
                    name="weightKg"
                    min="0"
                    max="200"
                    step="0.01"
                    className={inputClass}
                    placeholder="e.g. 8.5"
                  />
                </Field>
                <Field label="Size" error={errors.size}>
                  <Select
                    name="size"
                    options={SIZES}
                    defaultValue="medium"
                    size="compact"
                    className="mt-1"
                  />
                </Field>
                <Field label="Microchip number" hint="Optional, if one is present.">
                  <input name="microchipNo" maxLength={30} className={inputClass} />
                </Field>
                <Field label="Color and markings">
                  <input
                    name="colorMarkings"
                    maxLength={150}
                    className={inputClass}
                    placeholder="e.g. Brown with a white chest"
                  />
                </Field>
                <Field label="Behaviour">
                  <input
                    name="temperament"
                    maxLength={255}
                    className={inputClass}
                    placeholder="e.g. Gentle, a little shy"
                  />
                </Field>
              </div>

              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-ink/[0.08] px-3 py-2 text-[0.75rem] font-medium text-ink/65 transition-colors hover:border-ink/20">
                <input
                  type="checkbox"
                  name="isNeutered"
                  className="h-3.5 w-3.5 rounded border-ink/20 accent-moss"
                />
                Already neutered or spayed
              </label>
            </div>

            <div className={step === 2 ? "block" : "hidden"}>
              <div>
                <p className="text-[0.6875rem] font-medium text-ink/60">
                  Photo <span className="font-normal text-ink/35">· 1 image</span>
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />

                {photo ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-ink/15 bg-white p-2">
                    <img
                      src={photo.preview}
                      alt="Selected animal photo"
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.75rem] font-medium text-ink/75">
                        {photo.file.name}
                      </p>
                      <p className="text-[0.625rem] text-ink/40">
                        {(photo.file.size / 1024).toFixed(0)} KB · ready to upload
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="dangerGhost"
                      onClick={removePhoto}
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remove
                    </Button>
                  </div>
                ) : reportPhotoUrl ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-ink/15 bg-white p-2">
                    <img
                      src={reportPhotoUrl}
                      alt="Photo from the rescue report"
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.75rem] font-medium text-ink/75">
                        From {selectedReport?.reportCode ?? "the rescue report"}
                      </p>
                      <p className="text-[0.625rem] text-ink/40">
                        This photo will be reused for the animal.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="dangerGhost"
                      onClick={removePhoto}
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg border border-dashed border-ink/20 bg-ink/[0.012] px-3 py-3 text-left transition-colors hover:border-clay/50 hover:bg-clay/[0.03]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/40">
                      <ImagePlus className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.75rem] font-medium text-ink/70">
                        Attach a photo
                      </span>
                      <span className="block text-[0.625rem] text-ink/40">
                        PNG, JPG, or WebP up to 5 MB. Only one photo per animal.
                      </span>
                    </span>
                  </button>
                )}

                {errors.photo && (
                  <p className="mt-1 text-[0.625rem] font-medium text-[#b42318]">{errors.photo}</p>
                )}
              </div>

              <Field label="Notes" className="mt-4">
                <textarea
                  key={selectedReport?.id ?? "notes"}
                  name="description"
                  rows={3}
                  maxLength={10000}
                  defaultValue={selectedReport?.description ?? ""}
                  className={`${inputClass} h-auto resize-y py-2`}
                  placeholder="Anything else the care team should know — temperament notes, medical history, rescue circumstances…"
                />
              </Field>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t border-ink/[0.07] bg-white px-4 py-3">
          <span className="hidden items-center gap-1.5 text-[0.6875rem] text-ink/40 sm:inline-flex">
            <PawPrint className="h-3 w-3" strokeWidth={1.9} />
            Step {step + 1} of {STEPS.length}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={step === 0 ? onClose : handleBack}
            >
              {step === 0 ? (
                "Cancel"
              ) : (
                <>
                  <ChevronLeft className="h-3 w-3" strokeWidth={2} />
                  Back
                </>
              )}
            </Button>
            {isLast ? (
              <Button
                type="submit"
                onClick={() => {
                  submitIntentRef.current = true;
                }}
              >
                Save animal
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
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[0.6875rem] font-medium text-ink/60">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[0.625rem] font-medium text-[#b42318]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[0.625rem] text-ink/35">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2.5 text-[0.75rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay focus:ring-2 focus:ring-clay/15";
