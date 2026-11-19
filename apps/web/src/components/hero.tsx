"use client";

import { MotionConfig, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

import { Counter } from "@/components/ui/counter";
import { Magnetic } from "@/components/ui/magnetic";
import { heroStats } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

const lineVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const wordVariants = {
  hidden: { y: "112%" },
  show: {
    y: "0%",
    transition: { duration: 1.05, ease },
  },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const smallImageY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <MotionConfig reducedMotion="user">
    <section
      ref={sectionRef}
      className="relative overflow-hidden pb-14 pt-[108px] sm:pt-[120px] lg:pb-20 lg:pt-[148px]"
    >
      {/* faint vertical guides */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-ink/[0.06] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full bg-clay/[0.06] blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7 lg:pr-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              <span className="relative grid h-2 w-2 place-items-center">
                <span className="live-dot absolute inline-flex h-2 w-2 rounded-full bg-clay" />
                <span className="relative inline-flex h-1 w-1 rounded-full bg-clay" />
              </span>
              <p className="label text-ink/65">
                Animal rescue &amp; adoption
              </p>
              <span aria-hidden="true" className="h-3 w-px bg-ink/20" />
              <p className="label flex items-center gap-1.5 text-ink/65">
                <MapPin className="h-3 w-3" strokeWidth={1.6} />
                Mati City, Davao Oriental
              </p>
            </motion.div>

            <motion.h1
              variants={lineVariants}
              initial="hidden"
              animate="show"
              className="mt-7 font-display text-[clamp(3.15rem,7.15vw,6.7rem)] leading-[0.9] tracking-[-0.038em] text-ink sm:mt-8"
            >
              {["Every animal", "deserves a"].map((line) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span variants={wordVariants} className="block">
                    {line}
                  </motion.span>
                </span>
              ))}
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  variants={wordVariants}
                  className="block font-display-italic text-clay"
                >
                  way home.
                </motion.span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.42, ease }}
              className="mt-7 max-w-[47ch] text-pretty text-[1.0625rem] leading-[1.65] text-ink/70 sm:text-lg"
            >
              FuRescue is a volunteer-run network caring for the street animals
              of Mati City — one rescue, one foster, one family at a time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.54, ease }}
              className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
            >
              <Magnetic strength={7}>
                <a
                  href="#adopt"
                  className="group inline-flex h-[52px] items-center gap-3 rounded-full bg-ink pl-6 pr-2.5 text-[0.9375rem] font-medium text-paper transition-colors duration-300 hover:bg-moss"
                >
                  Meet the rescues
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-paper/10 transition-transform duration-400 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                </a>
              </Magnetic>

              <a
                href="#work"
                className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-ink/80 transition-colors hover:text-ink"
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.7} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.75 }}
              className="mt-12 grid max-w-[540px] grid-cols-3 border-t border-ink/15 pt-6"
            >
              {heroStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={index > 0 ? "border-l border-ink/15 pl-5 sm:pl-7" : ""}
                >
                  <p className="font-display text-[2rem] leading-none tracking-[-0.02em] sm:text-[2.4rem]">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="label mt-2.5 text-[0.625rem] text-ink/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Photo composition */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto h-[480px] w-full max-w-[540px] sm:h-[560px] lg:h-[640px] lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease }}
                className="absolute right-0 top-0 z-10 w-[76%] max-w-[390px]"
              >
                <motion.div style={{ y: imageY }} className="rotate-[-2.4deg]">
                  <figure className="border border-ink/10 bg-white p-2 shadow-[0_36px_70px_-32px_rgba(16,36,26,0.35)]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                      <Image
                        src="/images/pet-7.jpg"
                        alt="A young golden retriever rescue puppy holding a tulip stem"
                        fill
                        priority
                        sizes="(max-width: 1024px) 70vw, 390px"
                        className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
                      />
                    </div>
                    <figcaption className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
                      <span className="label whitespace-nowrap text-[0.5625rem] text-ink/55">
                        Dahican · 7:42 AM
                      </span>
                      <span className="label whitespace-nowrap text-[0.5625rem] text-ink/55">
                        First walk
                      </span>
                    </figcaption>
                  </figure>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.38, ease }}
                className="absolute bottom-2 left-0 z-20 w-[54%] max-w-[265px]"
              >
                <motion.div style={{ y: smallImageY }} className="rotate-[3.5deg]">
                  <figure className="border border-ink/10 bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(16,36,26,0.32)]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                      <Image
                        src="/images/pet-2.jpg"
                        alt="Two rescue dogs running together at sunrise in Mati City"
                        fill
                        sizes="(max-width: 1024px) 50vw, 265px"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="px-1.5 pb-0.5 pt-2">
                      <span className="label text-[0.5625rem] text-ink/55">
                        Saturday run club
                      </span>
                    </figcaption>
                  </figure>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.7, ease }}
                className="absolute left-0 top-[4%] z-30 grid h-[104px] w-[104px] rotate-[-7deg] place-content-center rounded-full border border-clay/20 bg-clay text-center text-paper shadow-[0_16px_40px_-16px_rgba(31,122,77,0.55)] sm:h-[118px] sm:w-[118px]"
              >
                <span className="font-display text-[2rem] leading-none sm:text-[2.35rem]">
                  916
                </span>
                <span className="label mt-1.5 text-[0.5rem] leading-[1.5] text-paper/80">
                  Homes
                  <br />
                  found
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </MotionConfig>
  );
}
