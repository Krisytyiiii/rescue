import type { Metadata } from "next";
import { ArrowLeft, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";

export const metadata: Metadata = {
  title: "Waiting for approval — FuRescue",
  description: "Your rescuer application is waiting for admin approval.",
};

interface PendingPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function PendingApprovalPage({ searchParams }: PendingPageProps) {
  const { email } = await searchParams;

  return (
    <main className="relative grid min-h-dvh bg-paper lg:grid-cols-[1.02fr_0.98fr]">
      <section className="flex flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:order-2 lg:px-14 lg:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3" aria-label="FuRescue home">
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

        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center py-10 lg:py-8">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay">
            <Clock3 className="h-6 w-6" strokeWidth={1.7} />
          </span>

          <p className="label mt-6 text-clay">Application received</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,3.3rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Waiting for{" "}
            <span className="font-display-italic text-clay">approval.</span>
          </h1>

          <p className="mt-5 text-pretty text-[0.9375rem] leading-[1.7] text-ink/65">
            Thanks for stepping up as a rescuer
            {email ? (
              <>
                {" "}
                for <span className="font-medium text-ink">{email}</span>
              </>
            ) : null}
            . Your account is now waiting for an administrator to review and
            approve your access.
          </p>

          <div className="mt-7 rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-moss" strokeWidth={1.7} />
              <div className="text-[0.875rem] leading-[1.65] text-ink/70">
                <p className="font-medium text-ink">What happens next</p>
                <p className="mt-1">
                  The City Vet team reviews rescuer applications. Once approved,
                  you&apos;ll be able to sign in, accept rescue assignments, and
                  record field updates.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-[0.8125rem] leading-[1.6] text-ink/55">
            You can close this page. If it takes longer than expected, contact
            the volunteer team and mention the email above.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss"
            >
              Back to log in
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-6 text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
            >
              Browse animals
            </Link>
          </div>
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
