import { ArrowUp } from "lucide-react";

import { PawMark, Wordmark } from "@/components/brand";

const columns = [
  {
    title: "Adopt",
    links: [
      { label: "Meet the rescues", href: "#adopt" },
      { label: "How adoption works", href: "#work" },
      { label: "Meet the rescuers", href: "#rescuers" },
      { label: "Become a foster", href: "mailto:foster@furescue.ph" },
      { label: "Field notes", href: "#stories" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-paper pb-6 pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 border-b border-ink/15 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <PawMark className="h-9 w-9 text-ink" />
              <Wordmark className="scale-110 origin-left" />
            </div>
            <p className="mt-5 max-w-[32ch] text-[0.9375rem] leading-[1.7] text-ink/55">
              A volunteer-run animal rescue and adoption network in Mati City,
              Davao Oriental. Kindness, organised.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <p className="label text-[0.5625rem] text-ink/35">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="link-line text-[0.8125rem] text-ink/65 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3 lg:col-start-10">
            <p className="label text-[0.5625rem] text-ink/35">Visit</p>
            <address className="mt-5 space-y-1.5 text-[0.8125rem] not-italic leading-relaxed text-ink/65">
              <p>Purok 5, Barangay Central</p>
              <p>Mati City, Davao Oriental 8200</p>
              <p>Philippines</p>
            </address>
          </div>
        </div>

        <div className="relative overflow-hidden pt-8">
          <p
            aria-hidden="true"
            className="select-none whitespace-nowrap font-display text-[clamp(3.6rem,15.2vw,14.5rem)] leading-[0.8] tracking-[-0.055em] text-ink"
          >
            Fu
            <span className="font-display-italic text-clay">Rescue</span>
            <span className="text-clay">.</span>
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-ink/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink/35">
            © 2026 FuRescue · Mati City
          </p>
          <p className="text-[0.6875rem] text-ink/35">
            Made with care by volunteers. No animal is ever sold.
          </p>
          <a
            href="#top"
            className="group inline-flex items-center gap-2 self-start text-[0.6875rem] font-medium text-ink/55 transition-colors hover:text-ink sm:self-auto"
            aria-label="Back to top"
          >
            Back to top
            <span className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 transition-colors group-hover:border-ink/35">
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.7} />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
