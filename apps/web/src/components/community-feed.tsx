"use client";

import { ArrowUpRight, Check, MapPin, PawPrint, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

export type CommunityAnimal = {
  id: string;
  name: string;
  image: string | null;
  animalCode: string;
  speciesLabel: string;
  breed: string;
  age: string;
  sex: string;
  size: string | null;
  colorMarkings: string | null;
  temperament: string | null;
  description: string | null;
  isNeutered: boolean;
  vaccinated: boolean;
  barangay: string;
  postedByName: string;
  postedLabel: string;
  isResidentPost: boolean;
};

export function CommunityFeed({
  posts,
  total,
}: {
  posts: CommunityAnimal[];
  total: number;
}) {
  const [active, setActive] = useState<CommunityAnimal | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;

    const previous = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [active]);

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-ink/15 py-4">
        <p className="label text-[0.5625rem] text-ink/45">
          {total} {total === 1 ? "post" : "posts"} for adoption
        </p>
        <p className="label text-[0.5625rem] text-ink/35">
          Newest first · Mati City
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={`Photo of ${post.name}`}
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-ink/20">
                    <PawPrint className="h-10 w-10" strokeWidth={1.4} />
                    <span className="sr-only">No photo attached</span>
                  </span>
                )}

                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper/94 px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-moss backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                  Posted for adoption
                </span>

                <span className="absolute bottom-3 left-3 rounded-full bg-ink/45 px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.08em] text-paper/80 backdrop-blur-sm">
                  {post.animalCode}
                </span>
              </div>

              <div className="flex flex-1 flex-col pt-4">
                <h2 className="font-display text-[1.65rem] leading-none tracking-[-0.02em]">
                  {post.name}
                </h2>

                <p className="mt-2 text-[0.875rem] text-ink/55">
                  {post.speciesLabel} · {post.breed}
                  {post.sex ? ` · ${post.sex}` : ""}
                  {post.age ? ` · ${post.age}` : ""}
                </p>

                {post.description && (
                  <p className="mt-3 line-clamp-3 text-[0.875rem] leading-[1.7] text-ink/60">
                    {post.description}
                  </p>
                )}

                {(post.size || post.colorMarkings) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.size && (
                      <span className="rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/50">
                        {post.size}
                      </span>
                    )}
                    {post.colorMarkings && (
                      <span className="max-w-full truncate rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/50">
                        {post.colorMarkings}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-[0.75rem] text-ink/50">
                      Posted by {post.postedByName}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/35">
                      {post.postedLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(post)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-[0.75rem] font-medium text-ink underline decoration-ink/20 underline-offset-4 transition-all duration-300 hover:text-clay hover:decoration-clay/40 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    View details
                    <ArrowUpRight className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                </div>

                <p className="mt-2 inline-flex items-center gap-1 text-[0.6875rem] text-ink/40">
                  <MapPin className="h-3 w-3" strokeWidth={1.6} />
                  {post.barangay}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-14 border border-dashed border-ink/20 px-6 py-16 text-center">
          <p className="font-display text-[1.6rem] tracking-[-0.02em]">
            No community posts yet.
          </p>
          <p className="mx-auto mt-2 max-w-[42ch] text-[0.875rem] leading-relaxed text-ink/55">
            New resident submissions appear here after our team reviews them.
          </p>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close animal details"
            onClick={() => setActive(null)}
            className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm"
            tabIndex={-1}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-animal-title"
            className="group relative z-10 w-full max-w-[980px] bg-paper shadow-[0_40px_90px_-40px_rgba(16,36,26,0.55)]"
          >
            <ScrollArea className="max-h-[92dvh] md:max-h-[86dvh]">
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[280px] bg-sand sm:min-h-[340px] md:min-h-[600px]">
                  {active.image ? (
                    <img
                      src={active.image}
                      alt={`Photo of ${active.name}`}
                      className="h-[320px] w-full object-cover sm:h-[380px] md:absolute md:inset-0 md:h-full"
                    />
                  ) : (
                    <span className="grid h-full min-h-[280px] w-full place-items-center text-ink/20">
                      <PawPrint className="h-12 w-12" strokeWidth={1.3} />
                      <span className="sr-only">No photo attached</span>
                    </span>
                  )}
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-paper/94 px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-moss backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                    Posted for adoption
                  </span>
                </div>

                <div className="flex flex-col p-6 sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="label text-[0.5625rem] text-ink/40">
                        {active.speciesLabel} · {active.barangay}
                      </p>
                      <h3
                        id="community-animal-title"
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
                    {active.size && (
                      <>
                        <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
                        <span>{active.size}</span>
                      </>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.6} />
                      {active.barangay}
                    </span>
                  </div>

                  <p className="mt-6 text-pretty text-[0.9375rem] leading-[1.75] text-ink/70">
                    {active.description ??
                      active.temperament ??
                      "Posted by a neighbour in Mati City."}
                  </p>

                  <dl className="mt-6 grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                    <div>
                      <dt className="label text-[0.5rem] text-ink/35">
                        Colour &amp; markings
                      </dt>
                      <dd className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink/65">
                        {active.colorMarkings ?? "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="label text-[0.5rem] text-ink/35">
                        Temperament
                      </dt>
                      <dd className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink/65">
                        {active.temperament ?? "Not provided"}
                      </dd>
                    </div>
                    <div>
                      <dt className="label text-[0.5rem] text-ink/35">Health</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/55">
                          <Check
                            className={`h-2.5 w-2.5 ${
                              active.vaccinated ? "text-moss" : "text-ink/25"
                            }`}
                            strokeWidth={2.2}
                          />
                          {active.vaccinated
                            ? "Vaccinated"
                            : "Vaccine status unknown"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-2.5 py-1 font-mono text-[0.5625rem] tracking-[0.04em] text-ink/55">
                          <Check
                            className={`h-2.5 w-2.5 ${
                              active.isNeutered ? "text-moss" : "text-ink/25"
                            }`}
                            strokeWidth={2.2}
                          />
                          {active.isNeutered
                            ? "Neutered / spayed"
                            : "Not neutered"}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="label text-[0.5rem] text-ink/35">
                        Posted by
                      </dt>
                      <dd className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink/65">
                        {active.postedByName} · {active.postedLabel}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-col gap-2 border-t border-ink/10 pt-5">
                    {active.isResidentPost && (
                      <a
                        href={`mailto:adopt@furescue.ph?subject=${encodeURIComponent(
                          `Community adoption — ${active.name}`,
                        )}`}
                        className="group/cta flex h-12 items-center justify-between rounded-full bg-ink px-6 text-[0.875rem] font-medium text-paper transition-colors hover:bg-moss"
                      >
                        Ask about {active.name}
                        <ArrowUpRight
                          className="h-4 w-4 transition-transform duration-300 group-hover/cta:rotate-45"
                          strokeWidth={1.7}
                        />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      className="flex h-10 items-center justify-center rounded-full border border-ink/15 text-[0.8125rem] font-medium transition-colors hover:border-ink/35"
                    >
                      Back to feed
                    </button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  );
}
