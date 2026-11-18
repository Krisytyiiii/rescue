"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Heart, ShieldCheck } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Reveal } from "@/components/ui/reveal";

const presets = [250, 500, 1000, 2500];
const MIN = 100;
const MAX = 5000;

const breakdown = [
  { label: "Veterinary care & medicine", value: 64 },
  { label: "Food, foster support & shelter", value: 24 },
  { label: "Transport & field costs", value: 12 },
];

function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Impact() {
  const [amount, setAmount] = useState(1500);
  const [monthly, setMonthly] = useState(false);
  const reduceMotion = useReducedMotion();

  const budget = monthly ? amount * 12 : amount;
  const meals = Math.max(1, Math.round(budget / 45));
  const vaccines = Math.floor(budget / 350);
  const surgeries = Math.floor(budget / 1500);
  const fill = ((amount - MIN) / (MAX - MIN)) * 100;

  return (
    <section
      id="support"
      className="relative overflow-hidden border-y border-ink/10 bg-paper-2/65 py-20 sm:py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-sage/20 blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="flex items-center justify-between border-b border-ink/15 pb-5">
                <span className="label text-ink/55">(04) — Support</span>
                <span className="label text-ink/35">Every peso, accounted</span>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mt-10 max-w-[11ch] text-balance font-display text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.98] tracking-[-0.032em]">
                Kindness,{" "}
                <span className="font-display-italic text-clay">itemised.</span>
              </h2>
              <p className="mt-6 max-w-[42ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink/65">
                One bag of kibble lasts four days. One vaccination prevents a
                litter. One surgery ends a cycle of street births. Small amounts
                do quiet, enormous work.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="mt-10 max-w-[440px]">
                <p className="label text-[0.5625rem] text-ink/40">
                  Where your gift goes
                </p>
                <div className="mt-5 space-y-4">
                  {breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[0.8125rem] text-ink/65">
                          {item.label}
                        </span>
                        <span className="font-mono text-[0.6875rem] text-ink/40">
                          {item.value}%
                        </span>
                      </div>
                      <div className="mt-2 h-px w-full bg-ink/12">
                        <motion.div
                          initial={reduceMotion ? false : { width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-px bg-clay"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[0.75rem] leading-relaxed text-ink/40">
                  92% of every peso reaches animal care. The rest keeps the
                  lights on and the van running. Books open to any donor.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <a
                href="mailto:volunteer@furescue.ph"
                className="group mt-10 inline-flex items-center gap-2 text-[0.875rem] font-medium"
              >
                Or give your time instead
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                  strokeWidth={1.7}
                />
              </a>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.08}>
              <div className="relative bg-forest p-5 text-paper shadow-[0_40px_90px_-50px_rgba(10,29,51,0.7)] sm:p-8 lg:p-9">
                <div className="flex items-center justify-between border-b border-paper/15 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay-soft" />
                    <p className="label text-[0.5625rem] text-paper/60">
                      The rescue ledger
                    </p>
                  </div>
                  <p className="font-mono text-[0.5625rem] tracking-[0.08em] text-paper/30">
                    NO. 2026—11
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="label text-[0.5rem] text-paper/40">Your gift</p>
                    <p className="mt-2 font-display text-[clamp(2.8rem,5vw,3.8rem)] leading-none tracking-[-0.03em]">
                      {peso(amount)}
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Donation frequency"
                    className="flex rounded-full border border-paper/15 p-1"
                  >
                    {[
                      { key: false, label: "One-time" },
                      { key: true, label: "Monthly" },
                    ].map((option) => {
                      const selected = monthly === option.key;
                      return (
                        <button
                          key={option.label}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setMonthly(option.key)}
                          className={`rounded-full px-3 py-1.5 text-[0.6875rem] font-medium transition-colors ${
                            selected
                              ? "bg-paper text-forest"
                              : "text-paper/55 hover:text-paper"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2">
                  {presets.map((preset) => {
                    const selected = amount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        aria-pressed={selected}
                        className={`rounded-sm border py-2.5 font-mono text-[0.6875rem] tracking-[0.02em] transition-colors ${
                          selected
                            ? "border-clay-soft bg-clay-soft/20 text-paper"
                            : "border-paper/25 bg-paper/[0.03] text-paper/65 hover:border-paper/45 hover:text-paper"
                        }`}
                      >
                        {peso(preset)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <input
                    type="range"
                    min={MIN}
                    max={MAX}
                    step={50}
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                    aria-label="Donation amount in Philippine pesos"
                    className="ledger-range"
                    style={{ "--fill": `${fill}%` } as CSSProperties}
                  />
                  <div className="mt-1 flex justify-between font-mono text-[0.5625rem] text-paper/30">
                    <span>{peso(MIN)}</span>
                    <span>Drag to adjust</span>
                    <span>{peso(MAX)}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-dashed border-paper/20 pt-2">
                  <p className="label py-3 text-[0.5rem] text-paper/35">
                    {monthly ? "In your first year, this becomes" : "This gift becomes"}
                  </p>
                  <ul>
                    {[
                      { label: "Meals for rescues", value: meals },
                      { label: "Vaccinations", value: vaccines },
                      { label: "Spay & neuter surgeries", value: surgeries },
                    ].map((item) => (
                      <li
                        key={item.label}
                        className="flex items-baseline justify-between gap-4 border-b border-paper/10 py-3 last:border-b-0"
                      >
                        <span className="text-[0.8125rem] text-paper/55">
                          {item.label}
                        </span>
                        <span className="flex items-baseline gap-2">
                          <motion.span
                            key={`${item.label}-${item.value}`}
                            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="font-display text-[1.5rem] leading-none text-paper"
                          >
                            {item.value.toLocaleString("en-US")}
                          </motion.span>
                          <span className="font-mono text-[0.5rem] text-paper/30">
                            {monthly ? "/ yr" : ""}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`mailto:give@furescue.ph?subject=${encodeURIComponent(
                    `Donation — ${peso(amount)}${monthly ? " monthly" : ""}`,
                  )}`}
                  className="group mt-7 flex h-[52px] items-center justify-between rounded-full bg-clay px-6 text-[0.875rem] font-medium text-paper transition-colors hover:bg-clay-soft"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart className="h-4 w-4" strokeWidth={1.7} />
                    Give {peso(amount)}
                    {monthly ? " monthly" : " once"}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45"
                    strokeWidth={1.8}
                  />
                </a>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center font-mono text-[0.5625rem] tracking-[0.04em] text-paper/30">
                  <ShieldCheck className="h-3 w-3" strokeWidth={1.6} />
                  Receipted by email · Cancel monthly anytime
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
