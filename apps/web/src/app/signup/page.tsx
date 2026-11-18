import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";
import { SignupForm } from "@/components/signup-form";
import { getBarangayOptions } from "@/lib/data/barangays";

export const metadata: Metadata = {
  title: "Sign up — FuRescue",
  description:
    "Join the FuRescue volunteer network in Mati City and follow the animals you help.",
};

interface SignupPageProps {
  searchParams: Promise<{ email?: string; error?: string; reason?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const barangays = await getBarangayOptions();
  const notice =
    params.reason === "not_registered"
      ? "That Google account isn't registered yet. Create your account below to continue."
      : undefined;

  return (
    <main className="relative grid min-h-dvh bg-paper lg:grid-cols-[1.02fr_0.98fr]">
      <section className="flex flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:order-2 lg:px-14 lg:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="FuRescue home"
          >
            <PawMark className="h-8 w-8 text-ink transition-transform duration-500 group-hover:-rotate-6" />
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="label inline-flex items-center gap-2 text-ink/60 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Back home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-10 lg:py-4">
          <p className="label text-clay">Join the network</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,3.6rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Create your{" "}
            <span className="font-display-italic text-clay">account.</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-pretty text-[0.9375rem] leading-[1.65] text-ink/65">
            Follow your fosters, donations, and the animals still waiting for a
            home in Mati City.
          </p>

          <SignupForm
            email={params.email}
            barangays={barangays}
            notice={notice}
            error={params.error}
          />
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
