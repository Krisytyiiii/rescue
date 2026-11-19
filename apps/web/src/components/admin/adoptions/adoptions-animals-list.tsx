"use client";

/* eslint-disable @next/next/no-img-element */
import {
  ArrowUpRight,
  Clock,
  HeartPulse,
  Inbox,
  PawPrint,
  Stethoscope,
  Syringe,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { OverlayCard } from "@/components/ui/overlay-card";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchEmpty } from "@/components/ui/search-empty";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { TabFilters } from "@/components/ui/tab-filters";

import {
  formatAge,
  formatDate,
  formatWeight,
  humanize,
  missingHealthText,
} from "../animals/animals-utils";
import { ORIGIN_LABELS } from "../animals/animals-types";
import type { AdoptionAnimalListRow } from "./adoptions-types";

const PAGE_SIZE = 12;

const SPECIES_OPTIONS = [
  { value: "", label: "All species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
];

const LIFECYCLE_META: Record<string, { label: string; tone: BadgeTone }> = {
  available: { label: "Available", tone: "success" },
  adoption_pending: { label: "Adoption pending", tone: "warning" },
  adopted: { label: "Adopted", tone: "info" },
};

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "available", label: "Ready for adoption" },
  { id: "adoption_pending", label: "Pending adoption" },
  { id: "adopted", label: "Adopted" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["id"];

const ORDER: Record<string, number> = {
  available: 0,
  adoption_pending: 1,
  adopted: 2,
};

function matches(haystack: Array<string | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.filter(Boolean).join(" ").toLowerCase().includes(needle);
}

function lifecycleMeta(status: string) {
  return (
    LIFECYCLE_META[status] ?? {
      label: humanize(status),
      tone: "neutral" as BadgeTone,
    }
  );
}

function missingHealth(animal: AdoptionAnimalListRow): string[] {
  return [
    animal.health.records === 0 ? "a medical note" : null,
    animal.health.vaccinations === 0 ? "a vaccination record" : null,
    !animal.health.hasHeartRate ? "a heart rate reading" : null,
  ].filter(Boolean) as string[];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.8125rem] font-medium text-ink/75">{value}</dd>
    </div>
  );
}

function DatePill({ animal }: { animal: AdoptionAnimalListRow }) {
  const value = animal.adoptedDate ?? animal.intakeDate;
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10241a] px-2.5 py-0.5 text-[0.625rem] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(6,32,20,0.7)] ring-1 ring-inset ring-white/20">
      <Clock className="h-3 w-3 shrink-0 text-white/70" strokeWidth={1.8} />
      <span className="font-medium text-white/70">
        {animal.adoptedDate ? "Adopted" : "Added"}
      </span>
      <span className="tabular-nums">{formatDate(value)}</span>
    </span>
  );
}

function BadgeRow({
  animal,
  surface = "dark",
}: {
  animal: AdoptionAnimalListRow;
  surface?: "dark" | "light";
}) {
  const lifecycle = lifecycleMeta(animal.lifecycleStatus);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="light" surface={surface} className="capitalize">
        <PawPrint className="h-3 w-3" strokeWidth={2} />
        {animal.species}
      </Badge>
      <Badge tone={lifecycle.tone} surface={surface}>
        {lifecycle.label}
      </Badge>
      {animal.health.ready ? (
        <Badge tone="success" surface={surface}>
          Ready for adoption
        </Badge>
      ) : (
        <Badge tone="warning" surface={surface}>
          Health checks pending
        </Badge>
      )}
      {animal.openApplications > 0 && (
        <Badge tone="pending" surface={surface}>
          {animal.openApplications} open {animal.openApplications === 1 ? "application" : "applications"}
        </Badge>
      )}
    </div>
  );
}

interface AdoptionAnimalsListProps {
  animals: AdoptionAnimalListRow[];
  onViewApplications: (animalCode: string) => void;
}

export function AdoptionAnimalsList({
  animals,
  onViewApplications,
}: AdoptionAnimalsListProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdoptionAnimalListRow | null>(null);

  const counts = useMemo(() => {
    const result: Record<StatusTab, number> = {
      all: animals.length,
      available: 0,
      adoption_pending: 0,
      adopted: 0,
    };
    for (const animal of animals) {
      if (animal.lifecycleStatus === "available") result.available += 1;
      if (animal.lifecycleStatus === "adoption_pending") result.adoption_pending += 1;
      if (animal.lifecycleStatus === "adopted") result.adopted += 1;
    }
    return result;
  }, [animals]);

  const filtered = useMemo(() => {
    return animals
      .filter((animal) => {
        if (statusTab !== "all" && animal.lifecycleStatus !== statusTab) return false;
        if (species && animal.species !== species) return false;
        return matches(
          [animal.animalCode, animal.name, animal.breedType, humanize(animal.species)],
          query,
        );
      })
      .sort((a, b) => {
        const order = (ORDER[a.lifecycleStatus] ?? 9) - (ORDER[b.lifecycleStatus] ?? 9);
        if (order !== 0) return order;
        return (a.name ?? a.animalCode).localeCompare(b.name ?? b.animalCode);
      });
  }, [animals, statusTab, species, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const hasFilters = Boolean(query || species || statusTab !== "all");

  function clearFilters() {
    setQuery("");
    setSpecies("");
    setStatusTab("all");
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink/[0.07] px-4 py-3">
        <TabFilters
          ariaLabel="Adoption animal status"
          value={statusTab}
          onChange={(next) => {
            setStatusTab(next);
            setPage(1);
          }}
          options={STATUS_TABS.map((item) => ({
            ...item,
            count: counts[item.id],
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
            placeholder="Search animal, breed, or code…"
            className="w-56 shrink-0 sm:w-64"
          />
          <Select
            name="adoption-animal-species"
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

      {paged.length === 0 ? (
        <SearchEmpty
          compact
          icon={animals.length === 0 ? PawPrint : undefined}
          title={
            animals.length === 0
              ? "No adoption animals yet"
              : "No animals match your filters"
          }
          description={
            animals.length === 0
              ? "Animals marked ready for adoption appear here."
              : "Try another status, species, or search term."
          }
          onClear={animals.length === 0 ? undefined : clearFilters}
          clearLabel="Clear filters"
        />
      ) : (
        <ul className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((animal) => {
            const missing = missingHealth(animal);

            return (
              <li key={animal.id} className="h-full">
                <article
                  role="button"
                  tabIndex={0}
                  aria-label={`Open adoption animal ${animal.name ?? animal.animalCode}`}
                  onClick={() => setSelected(animal)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(animal);
                    }
                  }}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white text-left outline-none transition-shadow hover:shadow-[0_16px_36px_-24px_rgba(16,36,26,0.5)] focus-visible:ring-2 focus-visible:ring-clay/40 focus-visible:ring-offset-2"
                >
                  <div className="relative h-60 w-full shrink-0 overflow-hidden bg-[#10241a]">
                    {animal.primaryPhotoUrl ? (
                      <img
                        src={animal.primaryPhotoUrl}
                        alt={`Photo of ${animal.name ?? animal.animalCode}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-white/25">
                        <PawPrint className="h-7 w-7" strokeWidth={1.5} />
                        <span className="sr-only">No photo attached</span>
                      </span>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-[#10241a]/15" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062013] via-[#062013]/70 to-transparent" />

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      <Badge tone="neutral" className="font-mono tracking-wide">
                        {animal.animalCode}
                      </Badge>
                      <DatePill animal={animal} />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3">
                      <p className="truncate text-[0.9375rem] font-semibold text-white">
                        {animal.name?.trim() || "Unnamed"}
                      </p>
                      <p className="line-clamp-2 text-[0.75rem] leading-[1.5] text-white/75">
                        {animal.description?.trim() ||
                          `${humanize(animal.breedType)} ${animal.species} · ${formatAge(
                            animal.estimatedAgeMonths,
                          )}`}
                      </p>
                      <div className="flex justify-end">
                        <BadgeRow animal={animal} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                      <Field label="Breed" value={humanize(animal.breedType)} />
                      <Field label="Sex" value={humanize(animal.sex)} />
                      <Field label="Age" value={formatAge(animal.estimatedAgeMonths)} />
                      <Field label="Weight" value={formatWeight(animal.weightKg)} />
                    </dl>

                    {animal.openApplications > 0 && (
                      <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#c99a4e]/20 bg-[#c99a4e]/[0.06] px-3 py-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c99a4e]/15 text-[#7a5212]">
                          <Inbox className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/40">
                            Adoption applications
                          </p>
                          <p className="truncate text-[0.75rem] font-semibold text-ink/80">
                            {animal.openApplications} waiting for review
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="mt-2.5 flex items-start gap-1.5 text-[0.6875rem] leading-[1.5] text-ink/45">
                      <Stethoscope className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.8} />
                      <span>
                        {animal.health.ready
                          ? `Ready for adoption · ${animal.health.records} medical ${
                              animal.health.records === 1 ? "note" : "notes"
                            } · ${animal.health.vaccinations} ${
                              animal.health.vaccinations === 1 ? "vaccination" : "vaccinations"
                            }`
                          : `Needs ${missingHealthText(missing)} before adoption`}
                      </span>
                    </p>

                    <div
                      className="mt-auto flex items-center gap-2 pt-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {animal.openApplications > 0 && (
                        <button
                          type="button"
                          onClick={() => onViewApplications(animal.animalCode)}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[#c99a4e]/45 bg-[#c99a4e]/10 px-2 text-[0.6875rem] font-medium text-[#7a5212] transition-colors hover:border-[#c99a4e]/70 hover:bg-[#c99a4e]/18"
                        >
                          Applications
                          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                        </button>
                      )}
                      <Link
                        href={`/admin/animals?focus=${animal.id}`}
                        className="inline-flex h-8 flex-1 items-center justify-center rounded-lg border border-ink/10 bg-white px-2 text-[0.6875rem] font-medium text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
                      >
                        View animal
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        itemLabel="animals"
        onPageChange={setPage}
        className="flex-wrap border-t border-ink/[0.07] px-4 py-3"
      />

      {selected && (
        <AnimalDetailModal
          animal={selected}
          onClose={() => setSelected(null)}
          onViewApplications={() => {
            const code = selected.animalCode;
            setSelected(null);
            onViewApplications(code);
          }}
        />
      )}
    </section>
  );
}

function AnimalDetailModal({
  animal,
  onClose,
  onViewApplications,
}: {
  animal: AdoptionAnimalListRow;
  onClose: () => void;
  onViewApplications: () => void;
}) {
  const missing = missingHealth(animal);

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="adoption-animal-modal-title"
      closeLabel="Close animal details"
      eyebrow="Adoption animal"
      title={animal.name?.trim() || animal.animalCode}
      meta={
        <>
          <BadgeRow animal={animal} surface="light" />
          <DatePill animal={animal} />
        </>
      }
      footer={
        <div className="flex w-full max-w-sm items-center gap-2">
          {animal.openApplications > 0 && (
            <button
              type="button"
              onClick={onViewApplications}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#c99a4e]/45 bg-[#c99a4e]/10 px-3 text-[0.75rem] font-medium text-[#7a5212] transition-colors hover:border-[#c99a4e]/70 hover:bg-[#c99a4e]/18"
            >
              View applications
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
          <Link
            href={`/admin/animals?focus=${animal.id}`}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-ink/10 bg-white px-3 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
          >
            Open animal profile
          </Link>
        </div>
      }
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative h-56 shrink-0 bg-[#10241a] md:h-full md:min-h-[480px]">
            {animal.primaryPhotoUrl ? (
              <img
                src={animal.primaryPhotoUrl}
                alt={`Photo of ${animal.name ?? animal.animalCode}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-white/25">
                <PawPrint className="h-8 w-8" strokeWidth={1.5} />
              </span>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062013]/70 via-transparent to-transparent" />
          </div>

          <div className="space-y-5 p-5">
            <section>
              <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                About
              </h3>
              <p className="mt-2 text-[0.875rem] leading-[1.65] text-ink/75">
                {animal.description?.trim() ||
                  "No description has been added for this animal yet."}
              </p>
            </section>

            <section>
              <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                Animal details
              </h3>
              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-ink/[0.07] bg-ink/[0.012] p-3.5">
                <Field label="Code" value={animal.animalCode} />
                <Field label="Species" value={humanize(animal.species)} />
                <Field label="Breed" value={humanize(animal.breedType)} />
                <Field label="Sex" value={humanize(animal.sex)} />
                <Field label="Age" value={formatAge(animal.estimatedAgeMonths)} />
                <Field label="Weight" value={formatWeight(animal.weightKg)} />
                <Field label="Size" value={animal.size ? humanize(animal.size) : "Not recorded"} />
                <Field
                  label="Color and markings"
                  value={animal.colorMarkings ?? "Not recorded"}
                />
                <Field
                  label="Behaviour"
                  value={animal.temperament ?? "Not recorded"}
                />
                <Field
                  label="Spayed or neutered"
                  value={animal.isNeutered ? "Yes" : "No"}
                />
                <Field label="Microchip number" value={animal.microchipNo ?? "Not recorded"} />
                <Field
                  label="Came from"
                  value={
                    ORIGIN_LABELS[animal.originType as keyof typeof ORIGIN_LABELS] ??
                    humanize(animal.originType)
                  }
                />
                <Field label="Added" value={formatDate(animal.intakeDate)} />
                <Field label="Adopted" value={formatDate(animal.adoptedDate)} />
              </dl>
            </section>

            <section>
              <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                Health checks
              </h3>
              <div className="mt-2 space-y-2">
                <div
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                    animal.health.ready
                      ? "border-[#2f7d5b]/15 bg-[#2f7d5b]/[0.05]"
                      : "border-[#c99a4e]/20 bg-[#c99a4e]/[0.06]"
                  }`}
                >
                  <span className="text-[0.8125rem] font-medium text-ink/75">
                    {animal.health.ready ? "Ready for adoption" : "Not ready for adoption yet"}
                  </span>
                  <Badge
                    tone={animal.health.ready ? "success" : "warning"}
                    surface="light"
                  >
                    {animal.health.ready ? "Ready" : "Needs care"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <HealthCount
                    icon={Stethoscope}
                    label="Medical records"
                    value={animal.health.records}
                  />
                  <HealthCount
                    icon={Syringe}
                    label="Vaccinations"
                    value={animal.health.vaccinations}
                  />
                  <HealthCount
                    icon={HeartPulse}
                    label="Heart rate"
                    value={animal.health.hasHeartRate ? 1 : 0}
                  />
                </div>

                {!animal.health.ready && (
                  <p className="text-[0.6875rem] leading-[1.5] text-ink/45">
                    Add {missingHealthText(missing)} before this animal can be adopted.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
                Adoption applications
              </h3>
              <p className="mt-2 text-[0.8125rem] leading-[1.6] text-ink/70">
                {animal.openApplications > 0
                  ? `${animal.openApplications} ${
                      animal.openApplications === 1 ? "application is" : "applications are"
                    } waiting for review.`
                  : "No one has applied to adopt this animal yet."}
              </p>
            </section>
          </div>
        </div>
      </ScrollArea>
    </OverlayCard>
  );
}

function HealthCount({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-ink/[0.07] bg-white px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
      <p className="mt-1.5 text-[0.9375rem] font-semibold tabular-nums text-ink/80">
        {value}
      </p>
      <p className="text-[0.5625rem] font-medium uppercase tracking-[0.08em] text-ink/35">
        {label}
      </p>
    </div>
  );
}
