import type { Metadata } from "next";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";
import { VerifyEmailForm } from "@/components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email — FuRescue",
  description: "Enter the one-time code we emailed you to activate your account.",
};

interface VerifyPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const { email } = await searchParams;
  const address = (email ?? "").trim();

  return (
    <main className="relative grid min-h-dvh bg-paper lg:grid-cols-[1.02fr_0.98fr]">
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
            Edit details
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-10 lg:py-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-clay/10 text-clay">
            <MailCheck className="h-6 w-6" strokeWidth={1.7} />
          </span>

          <p className="label mt-6 text-clay">Verify email</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,3.3rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Check your{" "}
            <span className="font-display-italic text-clay">inbox.</span>
          </h1>
          <p className="mt-5 text-[0.9375rem] leading-[1.7] text-ink/65">
            {address ? (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-medium text-ink">{address}</span>. Enter it
                below to activate your account.
              </>
            ) : (
              "Enter the 6-digit code we emailed you to activate your account."
            )}
          </p>

          {address ? (
            <VerifyEmailForm email={address} />
          ) : (
            <p className="mt-7 rounded-2xl border border-ink/10 bg-white p-5 text-[0.875rem] text-ink/65">
              Open the verification link from your sign-up email, or{" "}
              <Link href="/signup" className="font-medium text-clay">
                start again
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
