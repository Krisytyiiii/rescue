import { BadgeCheck, MapPin, PawPrint } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { RescuerProfile } from "@/lib/site";

export function MeetRescuers({ rescuers }: { rescuers: RescuerProfile[] }) {
  return (
    <section
      id="rescuers"
      className="relative scroll-mt-24 py-20 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">(04) — The crew</span>
            <span className="label hidden text-ink/40 sm:block">
              {rescuers.length} approved{" "}
              {rescuers.length === 1 ? "rescuer" : "rescuers"}
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
                Meet the people{" "}
                <span className="font-display-italic text-clay">
                  who show up.
                </span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <Reveal delay={0.1}>
              <p className="text-pretty text-[1.0625rem] leading-[1.7] text-ink/70">
                Verified volunteers on the ground in Mati City. Each one is
                approved by the team, trained on our field protocol, and on call
                when a report comes in.
              </p>
            </Reveal>
          </div>
        </div>

        {rescuers.length > 0 ? (
          <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
            {rescuers.map((rescuer, index) => (
              <Reveal key={rescuer.id} delay={Math.min(index, 4) * 0.06}>
                <RescuerCard rescuer={rescuer} index={index} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-14 rounded-2xl border border-ink/10 bg-sand/40 p-8">
              <p className="font-display text-2xl text-ink">
                The crew page is being verified.
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.6] text-ink/60">
                Approved rescuers will appear here as soon as they are onboarded.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function RescuerCard({
  rescuer,
  index,
}: {
  rescuer: RescuerProfile;
  index: number;
}) {
  const initials = rescuer.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden border border-ink/10 bg-white p-2 shadow-[0_24px_50px_-32px_rgba(16,36,26,0.35)]">
        <div className="relative h-full w-full overflow-hidden bg-sand">
          {rescuer.photo ? (
            <img
              src={rescuer.photo}
              alt={`Portrait of ${rescuer.name}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
            />
          ) : (
            <span className="grid h-full w-full place-items-center bg-gradient-to-br from-sage/70 via-sand to-paper-2">
              <span className="font-display text-[clamp(3rem,5vw,4.5rem)] leading-none text-moss/70">
                {initials || "FR"}
              </span>
            </span>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-moss backdrop-blur-sm">
            <BadgeCheck className="h-3 w-3" strokeWidth={1.9} />
            Approved
          </span>

          <span className="absolute bottom-3 left-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-paper/80">
            {String(index + 1).padStart(2, "0")} / Rescuer
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-[1.6rem] leading-[1.05] tracking-[-0.02em] text-ink">
          {rescuer.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-ink/55">
          <MapPin className="h-3 w-3" strokeWidth={1.7} />
          {rescuer.barangay}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/15 pt-3">
          <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink">
            <PawPrint className="h-3.5 w-3.5 text-clay" strokeWidth={1.7} />
            {rescuer.rescues}{" "}
            {rescuer.rescues === 1 ? "rescue" : "rescues"}
          </span>
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink/40">
            Since {rescuer.memberSince}
          </span>
        </div>
      </div>
    </article>
  );
}
