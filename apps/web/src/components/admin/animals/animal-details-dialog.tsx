"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

import type { AnimalRow } from "./animals-types";

const BREEDS = [
  { value: "aspin", label: "Aspin" },
  { value: "puspin", label: "Puspin" },
  { value: "mixed", label: "Mixed breed" },
  { value: "other", label: "Other" },
];

const SEXES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
];

const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const inputClass =
  "mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2.5 text-[0.75rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay focus:ring-2 focus:ring-clay/15";

interface AnimalDetailsDialogProps {
  animal: AnimalRow;
  onClose: () => void;
  /** Applies the edited fields immediately while the request runs. */
  onSaved: (changes: Partial<AnimalRow>) => void;
}

/** Edit an animal's profile. Closes on save and reports the result by toast. */
export function AnimalDetailsDialog({
  animal,
  onClose,
  onSaved,
}: AnimalDetailsDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  // This dialog sits on top of the animal drawer. Handle Escape here first and
  // stop it before the drawer's own listener runs, so canceling the edit never
  // closes the profile underneath.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onClose();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(formRef.current ?? undefined);
    const value = (key: string) => String(data.get(key) ?? "").trim();

    const weight = value("weightKg");
    const age = value("estimatedAgeMonths");

    const changes: Partial<AnimalRow> = {
      name: value("name") || null,
      breedType: value("breedType") || animal.breedType,
      sex: (value("sex") || animal.sex) as AnimalRow["sex"],
      size: value("size") || null,
      estimatedAgeMonths: age ? Number(age) : null,
      weightKg: weight || null,
      isNeutered: data.get("isNeutered") === "on",
      colorMarkings: value("colorMarkings") || null,
      temperament: value("temperament") || null,
      microchipNo: value("microchipNo") || null,
      description: value("description") || null,
    };

    const payload = {
      name: changes.name ?? undefined,
      breedType: changes.breedType,
      sex: changes.sex,
      size: changes.size ?? undefined,
      estimatedAgeMonths: changes.estimatedAgeMonths ?? undefined,
      weightKg: changes.weightKg ? Number(changes.weightKg) : undefined,
      isNeutered: changes.isNeutered,
      colorMarkings: changes.colorMarkings ?? undefined,
      temperament: changes.temperament ?? undefined,
      microchipNo: changes.microchipNo ?? undefined,
      description: changes.description ?? undefined,
    };

    onSaved(changes);
    onClose();

    void (async () => {
      try {
        const response = await fetch(`/api/admin/animals/${animal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(json?.error?.message ?? "The details could not be saved");
        }
        toast.success("Animal details updated", {
          description: `${animal.animalCode} now shows the new profile details.`,
        });
      } catch (error) {
        toast.error("Couldn't update the animal", {
          description: `${
            error instanceof Error ? error.message : "Something went wrong."
          } Please try again.`,
        });
      }
    })();
  }

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="animal-details-title"
      closeLabel="Close edit details"
      eyebrow={`Edit · ${animal.animalCode}`}
      title="Edit animal details"
      meta={
        <span className="text-[0.6875rem] text-ink/45">
          Changes are saved in the background.
        </span>
      }
      panelClassName="sm:max-w-2xl"
    >
      <form ref={formRef} onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                name="name"
                defaultValue={animal.name ?? ""}
                maxLength={60}
                placeholder="Unnamed"
                className={inputClass}
              />
            </Field>
            <Field label="Breed type">
              <Select
                name="breedType"
                options={BREEDS}
                defaultValue={animal.breedType}
                size="compact"
                className="mt-1"
              />
            </Field>
            <Field label="Sex">
              <Select
                name="sex"
                options={SEXES}
                defaultValue={animal.sex}
                size="compact"
                className="mt-1"
              />
            </Field>
            <Field label="Size">
              <Select
                name="size"
                options={[{ value: "", label: "Not recorded" }, ...SIZES]}
                defaultValue={animal.size ?? ""}
                size="compact"
                className="mt-1"
              />
            </Field>
            <Field label="Age (months)">
              <input
                type="number"
                name="estimatedAgeMonths"
                min="0"
                max="600"
                defaultValue={animal.estimatedAgeMonths ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                type="number"
                name="weightKg"
                min="0"
                max="200"
                step="0.01"
                defaultValue={animal.weightKg ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Color or markings">
              <input
                name="colorMarkings"
                defaultValue={animal.colorMarkings ?? ""}
                maxLength={150}
                className={inputClass}
              />
            </Field>
            <Field label="Temperament">
              <input
                name="temperament"
                defaultValue={animal.temperament ?? ""}
                maxLength={255}
                className={inputClass}
              />
            </Field>
            <Field label="Microchip number">
              <input
                name="microchipNo"
                defaultValue={animal.microchipNo ?? ""}
                maxLength={30}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-[0.75rem] font-medium text-ink/60">
              <input
                type="checkbox"
                name="isNeutered"
                defaultChecked={animal.isNeutered}
                className="h-3.5 w-3.5 accent-[#1f3d2b]"
              />
              Spayed or neutered
            </label>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                name="description"
                rows={3}
                defaultValue={animal.description ?? ""}
                maxLength={10_000}
                className={`${inputClass} h-auto py-2`}
              />
            </Field>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 border-t border-ink/[0.07] bg-ink/[0.012] px-5 py-3.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save details</Button>
        </div>
      </form>
    </OverlayCard>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[0.6875rem] font-medium text-ink/60">{label}</span>
      {children}
    </label>
  );
}
