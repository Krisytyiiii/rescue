import Link from "next/link";
import { ArrowUpRight, MessageSquarePlus, ShieldCheck } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Community feed — FuRescue",
  description:
    "Residents of Mati City post animals looking for homes. Browse community adoption posts.",
};

export default function CommunityPage() {
  return (
    <div id="top" className="relative flex min-h-full flex-col">
      <SiteHeader />

      <main id="main" className="flex-1 px-5 pb-24 pt-40 sm:px-8 lg:px-12 lg:pt-48">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-2xl">
            <p className="label text-clay">Community feed</p>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] tracking-[-0.03em] text-ink">
              Pets looking for homes, posted by the people who know them.
            </h1>
            <p className="mt-5 text-[1rem] leading-[1.7] text-ink/55">
              A resident-run adoption board for Mati City. Community members share
              animals in their care, and our team keeps the board safe and readable.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-clay/10 text-clay">
                <MessageSquarePlus className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <p className="mt-3 text-[0.9375rem] font-semibold text-ink">
                Posting opens soon
              </p>
              <p className="mt-1 text-[0.8125rem] leading-[1.6] text-ink/50">
                Community accounts will be able to publish adoption posts with
                photos, animal details, and their barangay.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-moss/10 text-moss">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <p className="mt-3 text-[0.9375rem] font-semibold text-ink">
                Moderated for safety
              </p>
              <p className="mt-1 text-[0.8125rem] leading-[1.6] text-ink/50">
                Our team reviews reports and hides posts that break community
                guidelines. Hidden posts are never shown to residents.
              </p>
            </div>
          </div>

          <Link
            href="/signup"
            className="group mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-ink pl-5 pr-3 text-[0.875rem] font-medium text-paper transition-colors hover:bg-moss"
          >
            Create a community account
            <span className="grid h-6 w-6 place-items-center rounded-full bg-paper/10 transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
