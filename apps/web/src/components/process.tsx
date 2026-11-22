import { ArrowRight, House, Siren, Stethoscope } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { steps } from "@/lib/site";

const icons = {
  siren: Siren,
  stethoscope: Stethoscope,
  house: House,
};

export function Process({ details }: { details: string[] }) {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-forest py-20 text-paper sm:py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        {[25, 50, 75].map((left) => (
          <span
            key={left}
            className="absolute inset-y-0 w-px bg-paper/[0.055]"
            style={{ left: `${left}%` }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/3 h-[360px] w-[360px] rounded-full bg-clay/10 blur-[110px]"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-paper/15 pb-5">
            <span className="label text-paper/50">(02) — How it works</span>
            <span className="label hidden text-paper/35 sm:block">
              Rescue → Rehabilitate → Rehome
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="max-w-[13ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
              From the street{" "}
              <span className="font-display-italic text-clay-soft">
                to someone&apos;s sofa.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <p className="text-pretty text-[1.0625rem] leading-[1.7] text-paper/60">
              There is no single dramatic moment. A rescue is a series of small,
              unglamorous decisions made by people who keep showing up.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 lg:mt-20">
          {steps.map((step, index) => {
            const Icon = icons[step.icon];
            return (
              <Reveal key={step.index} delay={index * 0.05}>
                <div className="group relative grid grid-cols-[auto_1fr] gap-y-5 border-t border-paper/15 py-8 transition-colors duration-500 hover:bg-paper/[0.025] lg:grid-cols-12 lg:items-start lg:gap-6 lg:px-2 lg:py-10">
                  <span className="label col-span-2 text-paper/35 lg:col-span-1">
                    {step.index}
                  </span>

                  <div className="lg:col-span-1">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-paper/20 text-paper/80 transition-colors duration-500 group-hover:border-clay-soft/60 group-hover:text-clay-soft">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    </span>
                  </div>

                  <div className="lg:col-span-4">
                    <h3 className="font-display text-[1.9rem] leading-none tracking-[-0.02em] transition-colors duration-500 group-hover:text-clay-soft sm:text-[2.2rem]">
                      {step.title}
                    </h3>
                    <p className="label mt-3 text-[0.5625rem] text-paper/35">
                      {details[index] ?? step.title}
                    </p>
                  </div>

                  <p className="col-span-2 max-w-[44ch] text-pretty text-[0.9375rem] leading-[1.7] text-paper/55 lg:col-span-5">
                    {step.copy}
                  </p>

                  <div className="col-span-2 flex justify-end lg:col-span-1">
                    <ArrowRight
                      className="mt-1 h-5 w-5 text-paper/20 transition-all duration-500 group-hover:translate-x-1 group-hover:text-clay-soft"
                      strokeWidth={1.4}
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
          <div className="border-t border-paper/15" />
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <p className="max-w-[42ch] text-[0.9375rem] leading-relaxed text-paper/50">
              We train every volunteer. No experience needed — only a
              willingness to get your shoes dirty.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
