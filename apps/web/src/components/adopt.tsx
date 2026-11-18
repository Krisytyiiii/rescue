"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUpRight, Check, Heart, MapPin, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Reveal } from "@/components/ui/reveal";
import { pets, type Pet } from "@/lib/site";

type Filter = "all" | Pet["species"];

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "dog", label: "Dogs" },
  { key: "cat", label: "Cats" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function statusClass(status: Pet["status"]) {
  if (status === "Reserved") return "bg-ink text-paper";
  if (status === "Foster needed") return "bg-clay text-paper";
  return "bg-paper/92 text-ink";
}

export function Adopt() {
  const [filter, setFilter] = useState<Filter>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [active, setActive] = useState<Pet | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const visiblePets = useMemo(
    () => (filter === "all" ? pets : pets.filter((pet) => pet.species === filter)),
    [filter],
  );

  const counts = useMemo(
    () => ({
      all: pets.length,
      dog: pets.filter((pet) => pet.species === "dog").length,
      cat: pets.filter((pet) => pet.species === "cat").length,
    }),
    [],
  );

  useEffect(() => {
    if (!active) return;

    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [active]);

  function toggleSaved(id: string) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <section id="adopt" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">(03) — Waiting for you</span>
            <span className="label hidden text-ink/40 sm:block">
              6 of 41 animals in our care
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
              Meet the ones{" "}
              <span className="font-display-italic text-clay">
                still looking.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-[38ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink/65">
              Every profile is written by the volunteer who knows them best.
              Tap a face to read their story — then come meet them in person.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-y border-ink/15 py-4 sm:flex-row sm:items-center sm:justify-between">
          <LayoutGroup id="pet-filters">
            <div
              role="tablist"
              aria-label="Filter adoptable animals"
              className="flex w-fit items-center gap-1 rounded-full border border-ink/15 p-1"
            >
              {filters.map((item) => {
                const selected = filter === item.key;
                return (
                  <button
                    key={item.key}
                    role="tab"
                    type="button"
                    aria-selected={selected}
                    onClick={() => setFilter(item.key)}
                    className={`relative rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
                      selected ? "text-paper" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="pet-filter-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {item.label}
                      <span
                        className={`font-mono text-[0.625rem] ${
                          selected ? "text-paper/55" : "text-ink/35"
                        }`}
                      >
                        {counts[item.key]}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="flex items-center gap-4">
            {saved.length > 0 && (
              <motion.p
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[0.75rem] text-ink/55"
              >
                <Heart className="h-3 w-3 fill-clay text-clay" strokeWidth={1.6} />
                {saved.length} saved
              </motion.p>
            )}
            <p className="label text-[0.5625rem] text-ink/40">
              Updated weekly · vaccinated &amp; assessed
            </p>
          </div>
        </div>

        <motion.div
          layout
          className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {visiblePets.map((pet) => {
              const isSaved = saved.includes(pet.id);
              return (
                <motion.article
                  key={pet.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.45, ease }}
                  className="group relative"
                >
                  <button
                    type="button"
                    onClick={() => setActive(pet)}
                    className="block w-full text-left"
                    aria-label={`Read ${pet.name}'s story`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                      <Image
                        src={pet.image}
                        alt={pet.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] backdrop-blur-sm ${statusClass(
                          pet.status,
                        )}`}
                      >
                        {pet.status}
                      </span>

                      <span className="pointer-events-none absolute bottom-4 right-4 flex translate-y-2 items-center gap-1.5 rounded-full bg-paper px-3.5 py-2 text-[0.75rem] font-medium text-ink opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                        Meet {pet.name}
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-[1.65rem] leading-none tracking-[-0.02em]">
                          {pet.name}
                        </h3>
                        <span className="label text-[0.5625rem] text-ink/40">
                          {pet.age}
                        </span>
                      </div>
                      <p className="mt-2 text-[0.875rem] text-ink/55">
                        {pet.breed} · {pet.sex} · {pet.size}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {pet.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.88 }}
                    onClick={() => toggleSaved(pet.id)}
                    aria-label={
                      isSaved
                        ? `Remove ${pet.name} from saved animals`
                        : `Save ${pet.name} for later`
                    }
                    aria-pressed={isSaved}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-paper/90 backdrop-blur-sm transition-colors hover:bg-paper"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isSaved
                          ? "fill-clay text-clay"
                          : "text-ink/60"
                      }`}
                      strokeWidth={1.6}
                    />
                  </motion.button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ink/15 pt-6 sm:flex-row sm:items-center">
            <p className="max-w-[48ch] text-[0.875rem] leading-relaxed text-ink/55">
              Can&apos;t adopt right now? Fostering is free — we cover food, vet
              care, and every question you might have.
            </p>
            <a
              href="mailto:foster@furescue.ph"
              className="group inline-flex items-center gap-2 text-[0.875rem] font-medium"
            >
              Become a foster home
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                strokeWidth={1.7}
              />
            </a>
          </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label="Close pet details"
              onClick={() => setActive(null)}
              className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm"
              tabIndex={-1}
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-dialog-title"
              key={active.id}
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.99 }}
              transition={{ duration: 0.45, ease }}
              className="relative z-10 grid max-h-[92dvh] w-full max-w-[980px] overflow-y-auto bg-paper md:max-h-[86dvh] md:grid-cols-2 md:overflow-hidden"
            >
              <div className="relative min-h-[280px] bg-sand sm:min-h-[340px] md:min-h-[600px]">
                <Image
                  src={active.image}
                  alt={active.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 490px"
                  className="object-cover"
                />
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] ${statusClass(
                    active.status,
                  )}`}
                >
                  {active.status}
                </span>
              </div>

              <div className="flex flex-col p-6 sm:p-9 md:max-h-[86dvh] md:overflow-y-auto">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label text-[0.5625rem] text-ink/40">
                      {active.species === "dog" ? "Dog" : "Cat"} ·{" "}
                      {active.barangay}
                    </p>
                    <h3
                      id="pet-dialog-title"
                      className="mt-2 font-display text-[clamp(2.6rem,5vw,3.6rem)] leading-none tracking-[-0.03em]"
                    >
                      {active.name}
                    </h3>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setActive(null)}
                    aria-label="Close"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/15 transition-colors hover:bg-ink/5"
                  >
                    <X className="h-4 w-4" strokeWidth={1.6} />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-ink/60">
                  <span>{active.breed}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                  <span>{active.age}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                  <span>{active.sex}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" strokeWidth={1.6} />
                    {active.barangay}
                  </span>
                </div>

                <p className="mt-6 text-pretty text-[0.9375rem] leading-[1.75] text-ink/70">
                  {active.story}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {active.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/55"
                    >
                      <Check className="h-2.5 w-2.5 text-moss" strokeWidth={2.2} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-l-2 border-clay/40 bg-ink/[0.025] py-3 pl-4 pr-3">
                  <p className="label text-[0.5rem] text-ink/35">
                    A note from their foster
                  </p>
                  <p className="mt-2 text-[0.875rem] italic leading-relaxed text-ink/65">
                    “{active.note}”
                  </p>
                </div>

                <div className="sticky bottom-0 z-20 -mx-6 mt-6 flex flex-col gap-2 border-t border-ink/10 bg-paper/95 px-6 pb-1 pt-4 backdrop-blur-sm sm:-mx-9 sm:px-9 md:static md:mx-0 md:mt-auto md:gap-3 md:border-0 md:bg-transparent md:p-0 md:pt-7 md:backdrop-blur-none">
                  <a
                    href={`mailto:adopt@furescue.ph?subject=${encodeURIComponent(
                      `Adoption inquiry — ${active.name}`,
                    )}`}
                    className="group flex h-12 items-center justify-between rounded-full bg-ink px-6 text-[0.875rem] font-medium text-paper transition-colors hover:bg-moss"
                  >
                    Start an application
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                      strokeWidth={1.7}
                    />
                  </a>
                  <a
                    href={`mailto:foster@furescue.ph?subject=${encodeURIComponent(
                      `Fostering ${active.name}`,
                    )}`}
                    className="flex h-10 items-center justify-center rounded-full border border-ink/15 text-[0.8125rem] font-medium transition-colors hover:border-ink/35 md:h-11"
                  >
                    Ask about fostering instead
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
