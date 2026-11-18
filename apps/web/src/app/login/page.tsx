import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Log in — FuRescue",
  description:
    "Sign in to follow your fosters, donations, and adoption updates at FuRescue Mati City.",
};

interface LoginPageProps {
  searchParams: Promise<{ email?: string; error?: string; reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const notice =
    params.reason === "signed_out" ? "You have been signed out." : undefined;

  return (
    <main className="relative grid min-h-dvh bg-paper lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:grid-cols-[1.02fr_0.98fr]">
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
          <p className="label text-clay">Account access</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,3.6rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Welcome{" "}
            <span className="font-display-italic text-clay">back.</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-pretty text-[0.9375rem] leading-[1.65] text-ink/65">
            Sign in to follow your fosters, donations, and the animals waiting
            for a home in Mati City.
          </p>

          <LoginForm email={params.email} error={error} notice={notice} />
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
