import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { PawMark } from "@/components/brand";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";

const missionStats = [
  { value: 1284, label: "Animals rescued", note: "since 2021" },
  { value: 2180, label: "Sterilisations", note: "free for community pets" },
  { value: 93, label: "Adoptions stable", note: "12 months after rehoming", suffix: "%" },
];

export function Mission() {
  return (
    <section id="work" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">(01) — The reason</span>
            <span className="label hidden text-ink/40 sm:block">
              Mati City · Davao Oriental
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="max-w-[15ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
                The street is where we start.{" "}
                <span className="font-display-italic text-clay">
                  Never where we stop.
                </span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <Reveal delay={0.1}>
              <p className="text-pretty text-[1.0625rem] leading-[1.7] text-ink/70">
                Every week our phones fill with photos of animals found in
                markets, under jeepneys, behind the resorts along Dahican. We
                answer what we can.
              </p>
              <p className="mt-5 text-pretty text-[1.0625rem] leading-[1.7] text-ink/70">
                Then comes the slower work: healing, socialising, and finding
                the people who will keep them. That part is not a rescue. It is
                a repair.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <PawMark className="h-7 w-7 text-clay" />
                <p className="label text-[0.625rem] leading-[1.6] text-ink/50">
                  The FuRescue team
                  <br />
                  Volunteers, fosters &amp; vets
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-8">
            <figure className="relative">
              <div className="relative aspect-[16/11] overflow-hidden bg-sand">
                <Image
                  src="/images/pet-4.jpg"
                  alt="A rescue cat curled beside a sleeping rescue dog in a sunny garden"
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="absolute bottom-4 left-4 right-4 border border-ink/10 bg-paper/95 p-5 backdrop-blur-sm sm:right-auto sm:max-w-[350px] sm:p-6">
                <p className="label text-[0.5625rem] text-clay">Our promise</p>
                <p className="mt-3 font-display text-[1.45rem] leading-[1.15] tracking-[-0.01em]">
                  No kill. No shortcuts. No animal leaves without a plan.
                </p>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink/55">
                  Every adoption includes a home visit, a follow-up call, and a
                  standing invitation to come back.
                </p>
              </figcaption>
            </figure>
          </Reveal>

          <div className="flex flex-col justify-between lg:col-span-4 lg:pl-4">
            <div>
              {missionStats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-t border-ink/15 py-6 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-display text-[2.6rem] leading-none tracking-[-0.03em]">
                      <Counter value={stat.value} suffix={stat.suffix ?? ""} />
                    </p>
                    <span className="label text-[0.5rem] text-ink/35">
                      {stat.note}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.875rem] text-ink/60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-ink/15 pt-5">
              <p className="label text-[0.5625rem] leading-relaxed text-ink/40">
                Updated March 2026
              </p>
              <a
                href="#stories"
                className="group inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink/70 transition-colors hover:text-ink"
              >
                Read the field notes
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45"
                  strokeWidth={1.7}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
