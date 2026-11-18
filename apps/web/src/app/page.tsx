import { Adopt } from "@/components/adopt";
import { Cta } from "@/components/cta";
import { Hero } from "@/components/hero";
import { Impact } from "@/components/impact";
import { Marquee } from "@/components/marquee";
import { Mission } from "@/components/mission";
import { Process } from "@/components/process";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Stories } from "@/components/stories";

export default function Home() {
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
        <Hero />
        <Marquee />
        <Mission />
        <Process />
        <Adopt />
        <Impact />
        <Stories />
        <Cta />
      </main>

      <SiteFooter />
    </div>
  );
}
