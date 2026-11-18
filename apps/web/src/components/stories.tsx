import Image from "next/image";

import { Reveal } from "@/components/ui/reveal";
import { fieldNotes, testimonials } from "@/lib/site";

export function Stories() {
  return (
    <section id="stories" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">(05) — Field notes</span>
            <span className="label text-ink/35">Vol. 04 · March 2026</span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <h2 className="max-w-[16ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.9rem)] leading-[0.98] tracking-[-0.032em]">
              Small rescues.{" "}
              <span className="font-display-italic text-clay">
                Long stories.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-[38ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink/65">
              Not every ending makes the news. These are the ones our volunteers
              talk about on the drive home.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-x-6 gap-y-14 lg:grid-cols-12 lg:gap-y-0">
          {fieldNotes.map((note, index) => (
            <Reveal
              key={note.id}
              delay={index * 0.06}
              className={
                index === 0
                  ? "lg:col-span-4"
                  : index === 1
                    ? "lg:col-span-4 lg:mt-12"
                    : "lg:col-span-4 lg:mt-24"
              }
            >
              <article className="group">
                <div
                  className={`relative overflow-hidden bg-sand ${
                    index === 1 ? "aspect-square" : "aspect-[4/5]"
                  }`}
                >
                  <Image
                    src={note.image}
                    alt={note.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.035]"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-paper/92 px-3 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink/70 backdrop-blur-sm">
                    {note.tag}
                  </span>
                </div>

                <h3 className="mt-5 max-w-[24ch] text-pretty font-display text-[1.55rem] leading-[1.12] tracking-[-0.015em] sm:text-[1.7rem]">
                  {note.title}
                </h3>
                <p className="mt-3 max-w-[40ch] text-[0.875rem] leading-[1.7] text-ink/55">
                  {note.copy}
                </p>
                <p className="label mt-4 text-[0.5rem] text-ink/35">
                  {note.meta}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-24 border-t border-ink/15 pt-5 lg:mt-32">
          <Reveal>
            <div className="flex items-center justify-between">
              <span className="label text-ink/55">
                (06) — From the community
              </span>
              <span className="label text-ink/35">Unedited</span>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.08}>
                <figure className="border-l border-clay/40 pl-6 lg:pl-8">
                  <blockquote className="text-balance font-display text-[clamp(1.35rem,2.1vw,1.75rem)] leading-[1.32] tracking-[-0.01em] text-ink/85">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 font-mono text-[0.5625rem] text-ink/50">
                      {item.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>
                      <span className="block text-[0.8125rem] font-medium">
                        {item.name}
                      </span>
                      <span className="label mt-1 block text-[0.5rem] text-ink/40">
                        {item.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
