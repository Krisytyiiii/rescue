import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import Image from "next/image";

import { Reveal } from "@/components/ui/reveal";

export function Cta() {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-paper">
      <Image
        src="/images/cta-dog.jpg"
        alt="A happy rescue dog running through grass at golden hour"
        fill
        sizes="100vw"
        className="object-cover object-[60%_45%] opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-transparent to-forest/30" />

      <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-12 lg:pb-24 lg:pt-32">
        <Reveal>
          <div className="flex items-center justify-between border-b border-paper/20 pb-5">
            <span className="label text-paper/55">The next chapter</span>
            <span className="label hidden text-paper/35 sm:block">
              Mati City · Davao Oriental
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.9rem,6vw,5.6rem)] leading-[0.94] tracking-[-0.035em]">
                There&apos;s a home waiting.{" "}
                <span className="font-display-italic text-clay-soft">
                  Maybe it&apos;s yours.
                </span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#adopt"
                  className="group inline-flex h-12 items-center gap-3 rounded-full bg-paper pl-6 pr-2 text-[0.875rem] font-medium text-ink transition-colors hover:bg-sand"
                >
                  Meet the rescues
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/8 transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                </a>
                <a
                  href="mailto:hello@furescue.ph"
                  className="group inline-flex items-center gap-2 border-b border-paper/30 pb-1 text-[0.875rem] font-medium text-paper transition-colors hover:border-clay-soft hover:text-clay-soft"
                >
                  Volunteer or foster
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                    strokeWidth={1.7}
                  />
                </a>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <Reveal delay={0.15}>
              <div className="border border-paper/20 bg-forest/55 p-5 backdrop-blur-md sm:p-6">
                <p className="label text-[0.5rem] text-paper/40">
                  Visit the shelter
                </p>
                <p className="mt-3 font-display text-[1.35rem] leading-[1.2] tracking-[-0.01em]">
                  Purok 5, Barangay Central,
                  <br />
                  Mati City, 8200
                </p>
                <div className="mt-5 space-y-2.5 border-t border-paper/15 pt-4 text-[0.8125rem] text-paper/60">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-paper/40" strokeWidth={1.6} />
                    Saturday–Sunday · 9am–4pm
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-paper/40" strokeWidth={1.6} />
                    Home visits by appointment
                  </p>
                </div>
                <a
                  href="https://maps.google.com/?q=Mati+City,+Davao+Oriental"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group mt-5 flex items-center justify-between border-t border-paper/15 pt-4 text-[0.75rem] font-medium text-paper/80 transition-colors hover:text-paper"
                >
                  Get directions
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45"
                    strokeWidth={1.7}
                  />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
