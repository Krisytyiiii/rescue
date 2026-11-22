import { Adopt } from "@/components/adopt";
import { AppShowcase } from "@/components/app-showcase";
import { Cta } from "@/components/cta";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { MeetRescuers } from "@/components/meet-rescuers";
import { Mission } from "@/components/mission";
import { Process } from "@/components/process";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stories } from "@/components/stories";
import { getHomepageData } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomepageData();

  return (
    <div id="top" className="relative flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        <Hero stats={data.heroStats} homesFound={data.homesFound} />
        <AppShowcase />
        <Marquee />
        <Mission stats={data.missionStats} updatedAt={data.lastUpdated} />
        <Process details={data.processDetails} />
        <Adopt pets={data.pets} />
        <MeetRescuers rescuers={data.rescuers} />
        <Stories />
        <Cta />
      </main>

      <SiteFooter />
    </div>
  );
}
