import { ArrowUpRight, Bell, Compass, Download, Home, MessageCircle, PawPrint, Plus, Search, User } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/reveal";



const APK_HREF =
  "https://github.com/Krisytyiiii/rescue/releases/latest/download/FuRescue.apk";

export function AppShowcase() {
  return (
    <section id="app" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage/[0.35] blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-center justify-between border-b border-ink/15 pb-5">
            <span className="label text-ink/55">In your pocket</span>
            <span className="label hidden text-ink/40 sm:block">
              Android · v1.0.0
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 lg:pr-6">
            <Reveal>
              <h2 className="max-w-[13ch] text-balance font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.032em]">
                The rescue van,{" "}
                <span className="font-display-italic text-clay">
                  in your pocket.
                </span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-[42ch] text-pretty text-[1.0625rem] leading-[1.7] text-ink/70">
                One app, two homes. Residents report animals in need and browse
                adoptions. Rescuers get dispatched, track their shift, and close
                every case from the field.
              </p>

              <div className="mt-8 grid gap-3">
                <Feature
                  icon={<MessageCircle className="h-4 w-4" strokeWidth={1.7} />}
                  title="Report in seconds"
                  body="Pin the location, add a photo, send it to dispatch."
                />
                <Feature
                  icon={<Bell className="h-4 w-4" strokeWidth={1.7} />}
                  title="Live dispatch"
                  body="Rescuers accept offers and see the next action."
                />
                <Feature
                  icon={<Home className="h-4 w-4" strokeWidth={1.7} />}
                  title="Adopt from the feed"
                  body="Every listing is reviewed by the City Vet team."
                />
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <a
                href={APK_HREF}
                download
                className="group mt-9 flex items-center gap-4 rounded-2xl bg-ink p-4 text-paper transition-colors duration-300 hover:bg-forest"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper/10">
                  <Download className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.9375rem] font-medium">
                    Download the Android app
                  </span>
                  <span className="mt-0.5 block text-xs text-paper/60">
                    APK · v1.0.0 · 125 MB
                  </span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-paper/60 transition-transform duration-300 group-hover:rotate-45 group-hover:text-paper"
                  strokeWidth={1.7}
                />
              </a>
              <p className="label mt-3 text-[0.5625rem] leading-[1.7] text-ink/45">
                Android 8.0+ · Allow installs from your browser when prompted
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal delay={0.08}>
              <div className="flex items-start justify-center gap-4 sm:gap-8 lg:gap-10">
                <Phone label="Resident" note="Report · Adopt · Feed">
                  <ResidentScreen />
                </Phone>
                <Phone label="Rescuer" note="Dispatch · Field · Shift" raised>
                  <RescuerScreen />
                </Phone>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3.5 rounded-xl border border-ink/10 bg-paper/60 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage/60 text-moss">
        {icon}
      </span>
      <span>
        <span className="block text-[0.875rem] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-ink/55">
          {body}
        </span>
      </span>
    </div>
  );
}

function Phone({
  label,
  note,
  raised = false,
  children,
}: {
  label: string;
  note: string;
  raised?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={raised ? "sm:-translate-y-5" : ""}>
      <div className="mx-auto w-[172px] rounded-[2.4rem] border border-ink/15 bg-ink p-[6px] shadow-[0_40px_80px_-36px_rgba(16,36,26,0.55)] sm:w-[240px] sm:rounded-[3rem] sm:p-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-paper-2 sm:rounded-[2.45rem]">
          <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-ink sm:h-5 sm:w-20" />
          <div className="h-[372px] overflow-hidden pt-8 sm:h-[508px] sm:pt-10">
            {children}
          </div>
        </div>
      </div>
      <figcaption className="mt-5 text-center">
        <span className="label block text-[0.625rem] text-ink">{label}</span>
        <span className="mt-1.5 block text-[0.6875rem] text-ink/45">{note}</span>
      </figcaption>
    </figure>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-1 text-[8px] font-medium tracking-wide text-ink/60 sm:text-[9px]">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-ink/50" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink/50" />
        <span className="h-1.5 w-3 rounded-[1px] border border-ink/50" />
      </span>
    </div>
  );
}

function ResidentScreen() {
  return (
    <div className="flex h-full flex-col bg-paper-2">
      <StatusBar />

      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <div>
          <p className="font-display text-[20px] leading-none tracking-[-0.03em] text-ink sm:text-[26px]">
            Feed
          </p>
          <p className="mt-1 text-[7px] uppercase tracking-[0.15em] text-ink/45 sm:text-[8px]">
            12 adoption posts
          </p>
        </div>
        <span className="grid h-7 w-7 place-items-center rounded-full border border-ink/10 bg-paper text-ink/70 sm:h-8 sm:w-8">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.7} />
        </span>
      </div>

      <div className="flex-1 overflow-hidden px-3.5">
        <div className="rounded-lg bg-sage/40 px-3 py-2.5">
          <p className="text-[7px] font-medium uppercase tracking-[0.14em] text-moss sm:text-[8px]">
            Adoption feed
          </p>
          <p className="mt-1 text-[8px] leading-[1.5] text-ink/60 sm:text-[9.5px]">
            Animals posted by residents looking for a home.
          </p>
        </div>

        <div className="mt-2.5 flex items-center gap-2 rounded-full border border-dashed border-clay/35 bg-paper px-3 py-2">
          <Plus className="h-3 w-3 text-clay" strokeWidth={2} />
          <span className="text-[8px] font-medium text-clay sm:text-[9.5px]">
            Share an animal for adoption
          </span>
        </div>

        <div className="mt-2.5 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-[0_10px_24px_-16px_rgba(16,36,26,0.4)]">
          <div className="relative h-[88px] sm:h-[128px]">
            <Image
              src="/images/pet-7.jpg"
              alt="A rescue puppy available for adoption"
              fill
              sizes="240px"
              className="object-cover"
            />
            <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-0.5 text-[6.5px] font-medium uppercase tracking-[0.1em] text-moss sm:text-[7.5px]">
              Ready for adoption
            </span>
          </div>
          <div className="px-2.5 pb-2.5 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-ink sm:text-[13px]">
                Mochi
              </p>
              <span className="text-[6.5px] uppercase tracking-[0.1em] text-ink/40 sm:text-[7.5px]">
                2h ago
              </span>
            </div>
            <p className="mt-0.5 text-[7.5px] text-ink/50 sm:text-[9px]">
              Aspin · 8 months · Female · Dahican
            </p>
            <p className="mt-1.5 line-clamp-2 text-[8px] leading-[1.45] text-ink/65 sm:text-[9.5px]">
              Found near the beach with a limp. Vet-cleared, vaccinated, and
              ready for a quiet home.
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-1.5">
              <span className="text-[7.5px] font-medium text-clay sm:text-[8.5px]">
                Apply to adopt
              </span>
              <ArrowUpRight className="h-3 w-3 text-clay" strokeWidth={1.8} />
            </div>
          </div>
        </div>
      </div>

      <TabBar
        items={[
          { icon: <Home className="h-4 w-4" strokeWidth={1.8} />, label: "Feed", active: true },
          { icon: <Compass className="h-4 w-4" strokeWidth={1.7} />, label: "Explore" },
          { icon: <Plus className="h-4 w-4" strokeWidth={1.8} />, label: "Report" },
          { icon: <User className="h-4 w-4" strokeWidth={1.7} />, label: "Profile" },
        ]}
      />
    </div>
  );
}

function RescuerScreen() {
  return (
    <div className="flex h-full flex-col bg-paper-2">
      <StatusBar />

      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <div>
          <p className="font-display text-[20px] leading-none tracking-[-0.03em] text-ink sm:text-[26px]">
            Today
          </p>
          <p className="mt-1 text-[7px] uppercase tracking-[0.15em] text-ink/45 sm:text-[8px]">
            Sat, Nov 22
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="relative grid h-7 w-7 place-items-center rounded-full border border-ink/10 bg-paper text-ink/70 sm:h-8 sm:w-8">
            <Bell className="h-3.5 w-3.5" strokeWidth={1.7} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-clay" />
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-ink/10 bg-paper text-ink/70 sm:h-8 sm:w-8">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.7} />
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3.5">
        <div className="rounded-2xl bg-forest p-2 sm:p-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            <Stat value="3" label="Assigned" />
            <Stat value="1" label="In progress" />
            <Stat value="2" label="Completed" />
          </div>

          <div className="mt-2 rounded-xl border border-paper/15 bg-paper/10 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[6.5px] uppercase tracking-[0.16em] text-sage sm:text-[7.5px]">
                Up next
              </span>
              <span className="flex items-center gap-1 rounded-full bg-paper/10 px-1.5 py-0.5">
                <span className="h-1 w-1 rounded-full bg-[#FF7664]" />
                <span className="text-[6px] uppercase tracking-[0.1em] text-paper/80 sm:text-[7px]">
                  Critical
                </span>
              </span>
            </div>
            <p className="mt-1.5 font-display text-[16px] leading-none text-paper sm:text-[20px]">
              FR-2481
            </p>
            <p className="mt-1 text-[7.5px] text-paper/60 sm:text-[9px]">
              Injured aspin · Dahican · 1.8 km
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="flex h-6 items-center gap-1 rounded-full bg-paper px-2 text-[7px] font-medium text-forest sm:text-[8px]">
                Accept rescue
                <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2} />
              </span>
              <span className="text-[6.5px] text-paper/50 sm:text-[7.5px]">
                4 min ago
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between px-0.5">
          <span className="text-[9px] font-medium text-ink sm:text-[10px]">
            Pending offers
          </span>
          <span className="text-[6.5px] uppercase tracking-[0.12em] text-ink/40 sm:text-[7.5px]">
            Needs a response
          </span>
        </div>

        <div className="mt-1.5 rounded-xl border border-[#F2B264]/40 bg-[#F2B264]/10 p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[#F2B264]/25 text-[#A46412]">
              <Bell className="h-2.5 w-2.5" strokeWidth={2} />
            </span>
            <span className="text-[7.5px] font-medium tracking-wide text-ink/55 sm:text-[8.5px]">
              FR-2483
            </span>
            <span className="ml-auto text-[6px] uppercase tracking-[0.1em] text-ink/45 sm:text-[7px]">
              12 min ago
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-semibold leading-[1.3] text-ink sm:text-[12px]">
            Emaciated dog near the public market
          </p>
          <p className="mt-1 text-[7px] text-ink/50 sm:text-[8.5px]">
            Dog · Central · 2.1 km · High priority
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="flex h-5 items-center gap-1 rounded-full border border-[#A46412]/40 bg-white/60 px-2 text-[6.5px] font-medium text-[#A46412] sm:text-[7.5px]">
              Review offer
              <ArrowUpRight className="h-2 w-2" strokeWidth={2.2} />
            </span>
            <span className="text-[6px] uppercase tracking-[0.1em] text-ink/40 sm:text-[7px]">
              Awaiting response
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between px-0.5">
          <span className="text-[9px] font-medium text-ink sm:text-[10px]">
            Quick actions
          </span>
          <span className="text-[6.5px] uppercase tracking-[0.12em] text-ink/40 sm:text-[7.5px]">
            Discover
          </span>
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <QuickAction icon={<Compass className="h-3 w-3" />} label="Explore map" tint="#1f7a4d" />
          <QuickAction icon={<PawPrint className="h-3 w-3" />} label="Animals" tint="#6B4FC2" />
        </div>
      </div>

      <TabBar
        items={[
          { icon: <Home className="h-4 w-4" strokeWidth={1.8} />, label: "Today", active: true },
          { icon: <Search className="h-4 w-4" strokeWidth={1.7} />, label: "Queue" },
          { icon: <MessageCircle className="h-4 w-4" strokeWidth={1.7} />, label: "Chat" },
          { icon: <User className="h-4 w-4" strokeWidth={1.7} />, label: "Profile" },
        ]}
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-paper/15 bg-paper/5 px-1.5 py-1.5 sm:px-2 sm:py-2">
      <p className="font-display text-[16px] leading-none text-paper sm:text-[20px]">
        {value}
      </p>
      <p className="mt-0.5 text-[5.5px] uppercase tracking-[0.1em] text-paper/60 sm:text-[6.5px]">
        {label}
      </p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  tint,
}: {
  icon: ReactNode;
  label: string;
  tint: string;
}) {
  return (
    <div
      className="rounded-lg border border-paper bg-white/60 p-2 shadow-[0_6px_14px_-10px_rgba(16,36,26,0.4)]"
      style={{ background: `linear-gradient(135deg, ${tint}22, rgba(255,255,255,0.6))` }}
    >
      <span
        className="inline-grid h-5 w-5 place-items-center rounded-md"
        style={{ color: tint, backgroundColor: `${tint}18` }}
      >
        {icon}
      </span>
      <p className="mt-1.5 text-[7.5px] font-medium text-ink sm:text-[8.5px]">
        {label}
      </p>
    </div>
  );
}

function TabBar({
  items,
}: {
  items: { icon: ReactNode; label: string; active?: boolean }[];
}) {
  return (
    <div className="mt-auto flex items-center justify-around border-t border-ink/10 bg-paper/90 px-2 pb-2 pt-1.5 backdrop-blur">
      {items.map((item) => (
        <span
          key={item.label}
          className={`flex flex-col items-center gap-0.5 ${
            item.active ? "text-clay" : "text-ink/35"
          }`}
        >
          {item.icon}
          <span className="text-[5.5px] font-medium sm:text-[6.5px]">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
