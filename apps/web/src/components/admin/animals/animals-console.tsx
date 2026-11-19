"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Archive,
  Cat,
  ChevronDown,
  Dog,
  ExternalLink,
  HeartPulse,
  PawPrint,
  Pencil,
  Plus,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { useToast } from "@/components/ui/toast";

import { AnimalDetailsDialog } from "./animal-details-dialog";
import { AnimalHealthPanel } from "./animal-health-panel";
import { AnimalIntakeDialog } from "./animal-intake-dialog";
import {
  HealthEntryDialog,
  type HealthEntryEdit,
  type HealthEntryKind,
} from "./health-entry-dialog";
import type { AnimalDraft, AnimalRow, LifecycleStatus } from "./animals-types";
import { LIFECYCLE_META, LISTING_META, MOVE_LABELS, ORIGIN_LABELS } from "./animals-types";
import {
  adoptionReadiness,
  formatAge,
  formatDate,
  formatWeight,
  humanize,
  missingHealthText,
  primaryWorkflow,
} from "./animals-utils";

type AnimalAction =
  | { kind: "care" | "ready" | "publish" | "adopt" | "archive"; animal: AnimalRow }
  | { kind: "reject"; animal: AnimalRow }
  | { kind: "status"; animal: AnimalRow; status: LifecycleStatus };

interface AnimalsConsoleProps {
  animals: AnimalRow[];
  /** True when a search term or filter is narrowing the list. */
  hasFilters?: boolean;
  onClearFilters?: () => void;
  /** Records an optimistic row change so the parent's filter sees it at once. */
  onOptimisticPatch?: (id: string, changes: Partial<AnimalRow>) => void;
  /** Hides an archived row instantly; `removed: false` restores it on failure. */
  onOptimisticRemove?: (id: string, removed: boolean) => void;
}

export function AnimalsConsole({
  animals,
  hasFilters = false,
  onClearFilters,
  onOptimisticPatch,
  onOptimisticRemove,
}: AnimalsConsoleProps) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(animals);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<AnimalAction | null>(null);
  const [reason, setReason] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [healthEntry, setHealthEntry] = useState<{
    animal: AnimalRow;
    kind: HealthEntryKind;
    entry?: HealthEntryEdit;
  } | null>(null);
  const [initialTab, setInitialTab] = useState<"profile" | "health">("profile");

  useEffect(() => {
    setRows(animals);
  }, [animals]);

  const selected = selectedId ? (rows.find((row) => row.id === selectedId) ?? null) : null;

  function patch(id: string, changes: Partial<AnimalRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
    onOptimisticPatch?.(id, changes);
  }

  /**
   * Shows the new animal straight away. The real row replaces it when the
   * server refresh arrives; a failure removes it and the toast explains why.
   */
  function addPending(draft: AnimalDraft, key: string) {
    const now = new Date().toISOString();
    const row: AnimalRow = {
      id: key,
      animalCode: "New animal",
      name: draft.name ?? null,
      species: draft.species,
      breedType: draft.breedType,
      sex: draft.sex,
      estimatedAgeMonths: draft.estimatedAgeMonths ?? null,
      size: draft.size ?? null,
      colorMarkings: draft.colorMarkings ?? null,
      temperament: draft.temperament ?? null,
      weightKg: draft.weightKg === undefined ? null : String(draft.weightKg),
      isNeutered: draft.isNeutered,
      microchipNo: draft.microchipNo ?? null,
      originType: draft.originType,
      lifecycleStatus: "under_care",
      listingStatus: "draft",
      intakeDate: draft.intakeDate ?? now.slice(0, 10),
      adoptedDate: null,
      primaryPhotoUrl: draft.photoUrl ?? null,
      model3dUrl: null,
      description: draft.description ?? null,
      sourceReport: null,
      postedBy: null,
      media: draft.photoUrl
        ? [
            {
              id: `${key}-photo`,
              mediaType: "photo",
              fileUrl: draft.photoUrl,
              caption: null,
              sortOrder: 0,
            },
          ]
        : [],
      healthRecords: [],
      vaccinations: [],
      hasHeartRate: false,
      createdAt: now,
      updatedAt: now,
      pending: true,
    };
    setRows((current) => [row, ...current.filter((item) => item.id !== key)]);
  }

  function settlePending(key: string, saved: boolean) {
    if (!saved) {
      setRows((current) => current.filter((row) => row.id !== key));
      return;
    }
    router.refresh();
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

  function openHealth(animal: AnimalRow) {
    setInitialTab("health");
    setSelectedId(animal.id);
  }

  /** Health entries open in their own modal on top of the details drawer. */
  function openHealthEntry(animal: AnimalRow, kind: HealthEntryKind) {
    setHealthEntry({ animal, kind });
  }

  function openEditHealthEntry(animal: AnimalRow, entry: HealthEntryEdit) {
    setHealthEntry({ animal, kind: entry.kind, entry });
  }

  async function runLifecycle(animal: AnimalRow, status: LifecycleStatus, remarks?: string) {
    if (status === "available") {
      const readiness = adoptionReadiness(animal);
      if (!readiness.ready) {
        toast.error("Health details needed first", {
          description: `Add ${missingHealthText(readiness.missing)} before this animal can be ready for adoption.`,
        });
        openHealth(animal);
        return;
      }
    }

    const previous = {
      lifecycleStatus: animal.lifecycleStatus,
      listingStatus: animal.listingStatus,
    };
    patch(animal.id, {
      lifecycleStatus: status,
      ...(status === "adopted" ? { listingStatus: "archived" as const } : {}),
    });

    try {
      await post(`/api/admin/animals/${animal.id}/lifecycle`, { status, remarks });
      toast.success("Status updated", {
        description: `${animal.animalCode} is now ${MOVE_LABELS[status].toLowerCase()}.`,
      });
      router.refresh();
    } catch (lifecycleError) {
      patch(animal.id, previous);
      toast.error("Couldn't update the animal", {
        description: `${
          lifecycleError instanceof Error ? lifecycleError.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  async function runReadyForAdoption(animal: AnimalRow) {
    const readiness = adoptionReadiness(animal);
    if (!readiness.ready) {
      toast.error("Health details needed first", {
        description: `Add ${missingHealthText(readiness.missing)} before this animal can be ready for adoption.`,
      });
      openHealth(animal);
      return;
    }

    const previous = {
      lifecycleStatus: animal.lifecycleStatus,
      listingStatus: animal.listingStatus,
    };
    patch(animal.id, { lifecycleStatus: "available", listingStatus: "published" });

    try {
      await post(`/api/admin/animals/${animal.id}/lifecycle`, { status: "available" });
    } catch (lifecycleError) {
      patch(animal.id, previous);
      toast.error("Couldn't mark this animal ready", {
        description: `${
          lifecycleError instanceof Error ? lifecycleError.message : "Something went wrong."
        } Please try again.`,
      });
      return;
    }

    try {
      await post(`/api/admin/animals/${animal.id}/listing`, { listingStatus: "published" });
      toast.success("Ready for adoption", {
        description: `${animal.animalCode} is now shown on the public adoption page.`,
      });
      router.refresh();
    } catch (listingError) {
      patch(animal.id, { listingStatus: previous.listingStatus });
      toast.error("Saved, but not public yet", {
        description: `${animal.animalCode} is marked ready for adoption, but couldn't be shown on the adoption page. ${
          listingError instanceof Error ? listingError.message : "Please try again."
        }`,
      });
    }
  }

  async function runListing(
    animal: AnimalRow,
    listingStatus: "published" | "rejected" | "archived",
    remarks?: string,
  ) {
    const previous = animal.listingStatus;
    patch(animal.id, { listingStatus });

    try {
      await post(`/api/admin/animals/${animal.id}/listing`, { listingStatus, remarks });
      toast.success(
        listingStatus === "published"
          ? "Shown on the adoption page"
          : listingStatus === "rejected"
            ? "Kept off the public page"
            : "Removed from the public page",
        {
          description:
            listingStatus === "published"
              ? `${animal.animalCode} is now visible to adopters.`
              : listingStatus === "rejected"
                ? `${animal.animalCode} will not appear publicly. The person who posted it can see your reason.`
                : `${animal.animalCode} is no longer visible to adopters.`,
        },
      );
      router.refresh();
    } catch (listingError) {
      patch(animal.id, { listingStatus: previous });
      toast.error("Couldn't update the public page", {
        description: `${
          listingError instanceof Error ? listingError.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  async function runArchive(animal: AnimalRow) {
    const previous = animal.listingStatus;
    const removedIndex = rows.findIndex((row) => row.id === animal.id);

    // Optimistic: hide the card and dismiss every open overlay right away.
    setRows((current) => current.filter((row) => row.id !== animal.id));
    onOptimisticRemove?.(animal.id, true);
    setSelectedId(null);
    setHealthEntry(null);
    setAction(null);

    try {
      await post(`/api/admin/animals/${animal.id}/archive`, {});
      toast.success("Removed from the list", {
        description: `${animal.animalCode} is hidden from active lists. Its medical notes and history are kept.`,
      });
      router.refresh();
    } catch (archiveError) {
      // Restore the card in its original position and report the failure.
      onOptimisticRemove?.(animal.id, false);
      setRows((current) => {
        if (current.some((row) => row.id === animal.id)) return current;
        const next = [...current];
        const index = removedIndex < 0 ? next.length : Math.min(removedIndex, next.length);
        next.splice(index, 0, { ...animal, listingStatus: previous });
        return next;
      });
      toast.error("Couldn't remove the animal", {
        description: `${
          archiveError instanceof Error ? archiveError.message : "Something went wrong."
        } Please try again.`,
      });
    }
  }

  function confirmAction() {
    if (!action) return;
    const animal = action.animal;
    const remarks = reason.trim() || undefined;

    // Close every overlay synchronously. The optimistic patch below runs before
    // the request is awaited, so the list updates while the backend works.
    setAction(null);
    setSelectedId(null);
    setHealthEntry(null);
    setReason("");

    switch (action.kind) {
      case "care":
        void runLifecycle(animal, "under_care", "Moved into city vet care");
        break;
      case "ready":
        void runReadyForAdoption(animal);
        break;
      case "publish":
        void runListing(animal, "published");
        break;
      case "reject":
        void runListing(animal, "rejected", remarks);
        break;
      case "adopt":
        void runLifecycle(animal, "adopted");
        break;
      case "archive":
        void runArchive(animal);
        break;
      case "status":
        void runLifecycle(animal, action.status, remarks);
        break;
    }
  }

  const requiresReason =
    action?.kind === "reject" ||
    (action?.kind === "status" &&
      ["deceased", "returned_to_owner"].includes(action.status));
  const confirmDisabled = Boolean(requiresReason) && !reason.trim();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <h2 className="text-[0.9375rem] font-semibold text-ink">All rescued animals</h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-ink/45">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            {rows.length} shown
          </span>
          <Button size="sm" onClick={() => setIntakeOpen(true)}>
            <Plus className="h-3 w-3" strokeWidth={2} />
            Add rescued animal
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <SearchEmpty
          className="py-16"
          icon={hasFilters ? undefined : PawPrint}
          title={hasFilters ? "No animals match your search" : "No animals yet"}
          description={
            hasFilters
              ? "Try a different code, name, or stage, or clear a filter."
              : "Register a rescued animal to start the registry."
          }
          onClear={hasFilters ? onClearFilters : undefined}
          clearLabel="Clear filters"
        />
      ) : (
        <ul className="grid gap-3 p-4 pt-0 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onOpen={() => {
                if (animal.pending) return;
                setInitialTab("profile");
                setSelectedId(animal.id);
              }}
              onOpenHealth={() => {
                if (animal.pending) return;
                openHealth(animal);
              }}
              onAction={setAction}
            />
          ))}
        </ul>
      )}

      {selected && (
        <AnimalDrawer
          key={selected.id}
          animal={selected}
          initialTab={initialTab}
          onClose={() => setSelectedId(null)}
          onAction={setAction}
          onAddHealthEntry={(kind) => openHealthEntry(selected, kind)}
          onEditHealthEntry={(entry) => openEditHealthEntry(selected, entry)}
          onEditSaved={(changes) => {
            patch(selected.id, changes);
            router.refresh();
          }}
        />
      )}

      {healthEntry && (
        <HealthEntryDialog
          open
          animal={healthEntry.animal}
          initialKind={healthEntry.kind}
          entry={healthEntry.entry}
          onClose={() => setHealthEntry(null)}
          onSaved={() => router.refresh()}
        />
      )}

      <AnimalIntakeDialog
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        onCreated={addPending}
        onSettled={settlePending}
      />

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setReason("");
          }
        }}
        title={actionTitle(action)}
        description={actionDescription(action)}
        confirmLabel={actionConfirmLabel(action)}
        tone={actionTone(action)}
        confirmDisabled={confirmDisabled}
        onConfirm={confirmAction}
      >
        {requiresReason && (
          <label className="block text-[0.625rem] font-medium uppercase tracking-[0.1em] text-ink/40">
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Explain the decision for the audit trail"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[0.8125rem] font-normal normal-case tracking-normal text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/15"
            />
          </label>
        )}
      </ConfirmDialog>
    </>
  );
}

function AnimalCard({
  animal,
  onOpen,
  onOpenHealth,
  onAction,
}: {
  animal: AnimalRow;
  onOpen: () => void;
  onOpenHealth: () => void;
  onAction: (action: AnimalAction) => void;
}) {
  const lifecycle = LIFECYCLE_META[animal.lifecycleStatus];
  const listing = LISTING_META[animal.listingStatus];
  const workflow = primaryWorkflow(animal);
  const readiness = adoptionReadiness(animal);
  const needsHealthFirst = workflow === "ready" && !readiness.ready;
  const photo = animal.primaryPhotoUrl ?? animal.media.find((item) => item.mediaType === "photo")?.fileUrl;
  const SpeciesIcon = animal.species === "cat" ? Cat : Dog;
  const pendingVaccines = animal.vaccinations.filter(
    (vaccination) => vaccination.status === "due" || vaccination.status === "overdue",
  ).length;

  return (
    <li className="h-full">
      <article
        role="button"
        tabIndex={0}
        aria-label={`Open ${animal.animalCode}`}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white text-left outline-none transition-shadow hover:shadow-[0_16px_36px_-24px_rgba(10,29,51,0.5)] focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2"
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundColor: lifecycle.pin }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${lifecycle.pin}1c 0%, ${lifecycle.pin}08 45%, transparent 80%)`,
            }}
          />

          <div className="relative flex items-start gap-3 p-3 pt-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink/[0.04] text-ink/30">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <SpeciesIcon className="h-5 w-5" strokeWidth={1.6} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[0.8125rem] font-semibold tracking-[-0.01em] text-ink">
                {animal.animalCode}
              </p>
              <p className="truncate text-[0.75rem] font-medium text-ink/60">
                {animal.name ?? humanize(animal.breedType)}
              </p>
            </div>

            <ChevronDown
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/30 transition-transform duration-200 group-hover:text-ink/50"
              strokeWidth={2}
            />
          </div>

          <div className="relative flex flex-wrap items-center gap-1.5 px-3">
            <Badge tone={lifecycle.tone} surface="light">
              {lifecycle.label}
            </Badge>
            <Badge tone={listing.tone} surface="light">
              {listing.label}
            </Badge>
            <Badge tone="neutral" surface="light" className="capitalize">
              <SpeciesIcon className="h-2.5 w-2.5" strokeWidth={2} />
              {animal.species}
            </Badge>
          </div>

          <div
            className="relative mx-3 mt-2.5 overflow-hidden rounded-lg border border-ink/[0.07] px-3"
            style={{
              background: `linear-gradient(120deg, ${lifecycle.pin}18 0%, ${lifecycle.pin}08 55%, rgba(255,255,255,0.6) 100%)`,
            }}
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 py-2">
              <MetaStat
                label="Sex · age"
                value={`${humanize(animal.sex)} · ${formatAge(animal.estimatedAgeMonths)}`}
              />
              <MetaStat
                label="Came from"
                value={ORIGIN_LABELS[animal.originType]}
                align="right"
              />
              <MetaStat
                label="Size"
                value={animal.size ? humanize(animal.size) : "Size unknown"}
              />
              <MetaStat
                label="Arrived"
                value={formatDate(animal.intakeDate)}
                align="right"
              />
            </dl>
          </div>

          <div className="relative mt-2.5 flex items-center gap-3 border-t border-ink/[0.06] px-3 py-2 text-[0.625rem] text-ink/45">
            <span className="inline-flex items-center gap-1">
              <Stethoscope className="h-3 w-3" strokeWidth={1.8} />
              {animal.healthRecords.length} medical notes
            </span>
            <span className="inline-flex items-center gap-1">
              <Syringe className="h-3 w-3" strokeWidth={1.8} />
              {animal.vaccinations.length} vaccinations
              {pendingVaccines > 0 && (
                <span className="font-semibold text-[#92400e]">{pendingVaccines} due</span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-ink/[0.06] p-2.5">
          {animal.pending ? (
            <span className="flex-1 rounded-lg bg-ink/[0.03] px-2.5 py-1.5 text-center text-[0.6875rem] font-medium text-ink/45">
              Adding to the registry…
            </span>
          ) : (
            <>
              <Button
                size="sm"
                variant={workflow && !needsHealthFirst ? "primary" : "secondary"}
                onClick={(event) => {
                  event.stopPropagation();
                  if (needsHealthFirst) onOpenHealth();
                  else if (workflow === "care") onAction({ kind: "care", animal });
                  else if (workflow === "ready") onAction({ kind: "ready", animal });
                  else if (workflow === "publish") onAction({ kind: "publish", animal });
                  else if (workflow === "adopt") onAction({ kind: "adopt", animal });
                  else onOpen();
                }}
                className="flex-1 justify-center"
              >
                {needsHealthFirst ? "Add health details" : workflowLabel(workflow)}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
              >
                Profile
              </Button>
            </>
          )}
        </div>
      </article>
    </li>
  );
}

function AnimalDrawer({
  animal,
  initialTab = "profile",
  onClose,
  onAction,
  onAddHealthEntry,
  onEditHealthEntry,
  onEditSaved,
}: {
  animal: AnimalRow;
  initialTab?: "profile" | "health";
  onClose: () => void;
  onAction: (action: AnimalAction) => void;
  onAddHealthEntry: (kind: HealthEntryKind) => void;
  onEditHealthEntry: (entry: HealthEntryEdit) => void;
  onEditSaved: (changes: Partial<AnimalRow>) => void;
}) {
  const [tab, setTab] = useState<"profile" | "health">(initialTab);
  const [editing, setEditing] = useState(false);
  const lifecycle = LIFECYCLE_META[animal.lifecycleStatus];
  const listing = LISTING_META[animal.listingStatus];
  const workflow = primaryWorkflow(animal);
  const readiness = adoptionReadiness(animal);
  const needsHealthFirst = workflow === "ready" && !readiness.ready;
  const workflowInfo = workflowCopy(workflow);
  const photo =
    animal.primaryPhotoUrl ?? animal.media.find((item) => item.mediaType === "photo")?.fileUrl;

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="animal-drawer-title"
      closeLabel="Close animal profile"
      eyebrow="Animal details"
      title={animal.animalCode}
      meta={
        <>
          <Badge tone={lifecycle.tone} surface="light">
            {lifecycle.label}
          </Badge>
          <Badge tone={listing.tone} surface="light">
            {listing.label}
          </Badge>
        </>
      }
    >
      <div className="flex items-center gap-1 border-b border-ink/[0.07] px-5 pt-2">
        {(
          [
            { id: "profile", label: "Details", icon: PawPrint },
            { id: "health", label: "Health", icon: HeartPulse },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[0.75rem] font-medium transition-colors ${
                active
                  ? "border-clay text-ink"
                  : "border-transparent text-ink/45 hover:text-ink/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
              {item.label}
            </button>
          );
        })}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-5">
          {tab === "health" ? (
            <AnimalHealthPanel
              animal={animal}
              onAddEntry={onAddHealthEntry}
              onEditEntry={onEditHealthEntry}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-ink/[0.04]">
                  {photo ? (
                    <img src={photo} alt={`Photo of ${animal.animalCode}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-ink/20">
                      <PawPrint className="h-8 w-8" strokeWidth={1.5} />
                    </span>
                  )}
                </div>

                {animal.media.filter((item) => item.mediaType === "photo").length > 1 && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {animal.media
                      .filter((item) => item.mediaType === "photo")
                      .slice(0, 4)
                      .map((item) => (
                        <div key={item.id} className="aspect-square overflow-hidden rounded-md bg-ink/[0.04]">
                          <img src={item.fileUrl} alt={item.caption ?? ""} className="h-full w-full object-cover" />
                        </div>
                      ))}
                  </div>
                )}

                <div className="rounded-xl border border-ink/[0.08] bg-ink/[0.012] p-3">
                  <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/40">
                    Progress
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[0.6875rem] text-ink/55">
                    <CareStep done={["rescued", "under_care", "available", "adoption_pending", "adopted"].includes(animal.lifecycleStatus)} label="Rescued and added" />
                    <CareStep done={["under_care", "available", "adoption_pending", "adopted"].includes(animal.lifecycleStatus)} label="At the city vet" />
                    <CareStep done={["available", "adoption_pending", "adopted"].includes(animal.lifecycleStatus)} label="Ready for adoption" />
                    <CareStep done={animal.listingStatus === "published" || animal.lifecycleStatus === "adopted"} label="Shown on adoption page" />
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                      About
                    </h3>
                    <Button
                      size="xs"
                      variant="tertiary"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
                      Edit details
                    </Button>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-ink/[0.07] bg-ink/[0.012] p-3.5">
                    <Field label="Name" value={animal.name ?? "Unnamed"} />
                    <Field label="Species" value={humanize(animal.species)} />
                    <Field label="Breed" value={humanize(animal.breedType)} />
                    <Field label="Sex" value={humanize(animal.sex)} />
                    <Field label="Age" value={formatAge(animal.estimatedAgeMonths)} />
                    <Field label="Size" value={animal.size ? humanize(animal.size) : "Unknown"} />
                    <Field label="Weight" value={formatWeight(animal.weightKg)} />
                    <Field
                      label="Spayed / neutered"
                      value={animal.isNeutered ? "Yes" : "No"}
                    />
                    <Field label="Color / markings" value={animal.colorMarkings ?? "—"} />
                    <Field label="Behaviour" value={animal.temperament ?? "—"} />
                    <Field label="Arrived" value={formatDate(animal.intakeDate)} />
                    <Field label="Came from" value={ORIGIN_LABELS[animal.originType]} />
                  </dl>
                </div>

                {animal.description && (
                  <div>
                    <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                      Description
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-[1.65] text-ink/65">
                      {animal.description}
                    </p>
                  </div>
                )}

                {(animal.sourceReport || animal.postedBy) && (
                  <div className="space-y-1.5 text-[0.6875rem]">
                    {animal.sourceReport && (
                      <p className="flex items-center justify-between gap-2">
                        <span className="text-ink/40">Rescue report</span>
                        <a
                          href={`/admin/reports?q=${encodeURIComponent(animal.sourceReport.reportCode)}`}
                          className="inline-flex items-center gap-1 font-medium text-clay underline-offset-2 hover:underline"
                        >
                          {animal.sourceReport.reportCode}
                          <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
                        </a>
                      </p>
                    )}
                    {animal.postedBy && (
                      <p className="flex items-center justify-between gap-2">
                        <span className="text-ink/40">Added by</span>
                        <span className="font-medium text-ink/65">
                          {animal.postedBy.firstName} {animal.postedBy.lastName}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-ink/[0.08] bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/40">
                      Next steps
                    </p>
                    <Sparkles className="h-3.5 w-3.5 text-clay" strokeWidth={1.9} />
                  </div>
                  <p className="mt-0.5 text-[0.625rem] text-ink/45">
                    Choose what should happen to this animal next.
                  </p>

                  {needsHealthFirst ? (
                    <div className="mt-2.5 rounded-lg border border-[#c99a4e]/30 bg-[#c99a4e]/[0.07] p-2.5">
                      <p className="text-[0.6875rem] font-semibold text-[#7a5212]">
                        Health details are needed first
                      </p>
                      <p className="mt-0.5 text-[0.625rem] leading-[1.5] text-ink/55">
                        Before this animal can be shown for adoption, add{" "}
                        {missingHealthText(readiness.missing)}.
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => setTab("health")}
                      >
                        <Stethoscope className="h-3 w-3" strokeWidth={2} />
                        Open Health tab
                      </Button>
                    </div>
                  ) : (
                    workflowInfo && (
                      <div className="mt-2.5 rounded-lg border border-clay/25 bg-clay/[0.04] p-2.5">
                        <p className="text-[0.5313rem] font-semibold uppercase tracking-[0.11em] text-clay">
                          Recommended
                        </p>
                        <p className="mt-1 text-[0.75rem] font-semibold text-ink/80">
                          {workflowInfo.title}
                        </p>
                        <p className="mt-0.5 text-[0.625rem] leading-[1.5] text-ink/50">
                          {workflowInfo.hint}
                        </p>
                        <Button
                          className="mt-2 w-full justify-center"
                          onClick={() => {
                            if (workflow === "care") onAction({ kind: "care", animal });
                            else if (workflow === "ready") onAction({ kind: "ready", animal });
                            else if (workflow === "publish") onAction({ kind: "publish", animal });
                            else if (workflow === "adopt") onAction({ kind: "adopt", animal });
                          }}
                        >
                          {workflowInfo.action}
                        </Button>
                      </div>
                    )
                  )}

                  <div className="mt-3 flex items-start justify-between gap-3 border-t border-ink/[0.06] pt-2">
                    <div className="min-w-0">
                      <p className="text-[0.625rem] font-medium text-ink/55">
                        No longer available?
                      </p>
                      <p className="mt-0.5 text-[0.5625rem] leading-[1.4] text-ink/35">
                        Hides this animal from the active lists. Medical history is kept.
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="dangerGhost"
                      className="mt-0.5 shrink-0"
                      onClick={() => onAction({ kind: "archive", animal })}
                    >
                      <Archive className="h-2.5 w-2.5" strokeWidth={2} />
                      Remove from lists
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {editing && (
        <AnimalDetailsDialog
          animal={animal}
          onClose={() => setEditing(false)}
          onSaved={(changes) => {
            onEditSaved(changes);
            setEditing(false);
          }}
        />
      )}
    </OverlayCard>
  );
}

function CareStep({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[0.5rem] font-bold ${
          done ? "bg-moss text-white" : "bg-ink/[0.07] text-ink/30"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-ink/70" : ""}>{label}</span>
    </li>
  );
}

function MetaStat({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <dt className="text-[0.5rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.6875rem] font-medium text-ink/70">{value}</dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.5rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.75rem] font-medium text-ink/75">{value}</dd>
    </div>
  );
}

function workflowCopy(
  workflow: string | null,
): { title: string; hint: string; action: string } | null {
  switch (workflow) {
    case "care":
      return {
        title: "Send to the city vet",
        hint: "Start medical care for this animal. Health records can be added from the Health tab.",
        action: "Send to city vet",
      };
    case "ready":
      return {
        title: "Ready for adoption",
        hint: "Show this animal on the public adoption page so people can meet them.",
        action: "Show on adoption page",
      };
    case "publish":
      return {
        title: "Show the adoption listing",
        hint: "Make this animal visible to people looking to adopt.",
        action: "Show on adoption page",
      };
    case "adopt":
      return {
        title: "Complete the adoption",
        hint: "Mark this animal as adopted and take them off the public page.",
        action: "Mark as adopted",
      };
    default:
      return null;
  }
}

function workflowLabel(workflow: string | null): string {
  switch (workflow) {
    case "care":
      return "Send to city vet care";
    case "ready":
      return "Ready for adoption";
    case "publish":
      return "Show on adoption page";
    case "adopt":
      return "Mark adopted";
    default:
      return "View details";
  }
}

function actionTitle(action: AnimalAction | null): string {
  if (!action) return "";
  switch (action.kind) {
    case "care":
      return "Send this animal to the city vet?";
    case "ready":
      return "Is this animal ready for adoption?";
    case "publish":
      return "Show this animal on the adoption page?";
    case "reject":
      return "Keep this animal off the public page?";
    case "adopt":
      return "Mark this animal as adopted?";
    case "archive":
      return "Remove this animal from the list?";
    case "status":
      return `Move to ${MOVE_LABELS[action.status]}?`;
  }
}

function actionDescription(action: AnimalAction | null): string {
  if (!action) return "";
  const code = action.animal.animalCode;
  switch (action.kind) {
    case "care":
      return `${code} will be moved to the city vet for care. You can add medical notes and vaccinations from the Health tab while it recovers.`;
    case "ready":
      return `${code} will be marked ready for adoption and shown on the public adoption page.`;
    case "publish":
      return `${code} will be visible on the public adoption page right away.`;
    case "reject":
      return `${code} will not appear on the public page. The person who posted it will be told why.`;
    case "adopt":
      return `${code} will be marked as adopted and removed from the adoption page.`;
    case "archive":
      return `${code} will be removed from the active lists. Its medical notes and history are kept.`;
    case "status":
      return `${code} will move from ${MOVE_LABELS[action.animal.lifecycleStatus].toLowerCase()} to ${MOVE_LABELS[action.status].toLowerCase()}.`;
  }
}

function actionConfirmLabel(action: AnimalAction | null): string {
  if (!action) return "Confirm";
  switch (action.kind) {
    case "care":
      return "Send to city vet";
    case "ready":
      return "Show for adoption";
    case "publish":
      return "Show on adoption page";
    case "reject":
      return "Keep private";
    case "adopt":
      return "Mark adopted";
    case "archive":
      return "Remove from lists";
    case "status":
      return "Save status";
  }
}

function actionTone(action: AnimalAction | null): "default" | "danger" | "success" {
  if (!action) return "default";
  if (action.kind === "reject" || action.kind === "archive") return "danger";
  if (action.kind === "ready" || action.kind === "publish" || action.kind === "adopt") {
    return "success";
  }
  return "default";
}
