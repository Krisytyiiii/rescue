import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";
import { CompleteProfileForm } from "@/components/complete-profile-form";
import { readOnboarding } from "@/lib/auth/session";
import { getBarangayOptions } from "@/lib/data/barangays";

export const metadata: Metadata = {
  title: "Finish sign up — FuRescue",
  description: "Complete your FuRescue profile to start helping animals in Mati City.",
};

export default async function CompleteProfilePage() {
  const pending = await readOnboarding();
  if (!pending) redirect("/signup?error=" + encodeURIComponent("Start with Google sign up to continue"));

  const barangays = await getBarangayOptions();

  return (
    <main className="relative grid min-h-dvh bg-paper lg:min-h-0 lg:grid-cols-[1.02fr_0.98fr]">
      <section className="flex flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:order-2 lg:px-14 lg:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3" aria-label="FuRescue home">
            <PawMark className="h-8 w-8 text-ink transition-transform duration-500 group-hover:-rotate-6" />
            <Wordmark />
          </Link>
          <Link
            href="/signup"
            className="label inline-flex items-center gap-2 text-ink/60 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Back
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10 lg:py-8">
          <p className="label text-clay">One last step</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,3.3rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Complete your{" "}
            <span className="font-display-italic text-clay">profile.</span>
          </h1>
          <p className="mt-4 max-w-[42ch] text-pretty text-[0.9375rem] leading-[1.65] text-ink/65">
            Your Google email is verified. Add the details our rescue team uses to
            coordinate with you.
          </p>

          <CompleteProfileForm
            email={pending.email}
            firstName={pending.firstName}
            lastName={pending.lastName}
            barangays={barangays}
          />
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
