import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { AuthAside } from "@/components/auth-aside";
import { PawMark, Wordmark } from "@/components/brand";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Administrator portal — FuRescue",
  description: "Restricted access for City Vet and animal welfare administrators.",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const session = await readSession();
  if (session?.role === "admin") redirect("/admin");

  const { error } = await searchParams;

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
          <p className="label text-clay">Restricted access</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,3.6rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            Administrator{" "}
            <span className="font-display-italic text-clay">portal.</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-pretty text-[0.9375rem] leading-[1.65] text-ink/65">
            City Vet and animal welfare staff only. All administrator actions are
            recorded in the audit trail.
          </p>

          <AdminLoginForm error={error} />
        </div>
      </section>

      <AuthAside />
    </main>
  );
}
