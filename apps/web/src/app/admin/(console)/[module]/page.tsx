import type { Metadata } from "next";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ADMIN_MODULES } from "@/lib/admin/modules";

interface ModulePageProps {
  params: Promise<{ module: string }>;
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { module } = await params;
  const meta = ADMIN_MODULES[module];
  return {
    title: meta ? `${meta.title} — FuRescue admin` : "Admin — FuRescue",
    robots: { index: false, follow: false },
  };
}

export default async function AdminModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  const meta = ADMIN_MODULES[module];
  if (!meta) notFound();

  return (
    <div className="w-full">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium text-ink/50 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        Dashboard
      </Link>

      <p className="mt-6 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-clay">
        {meta.group}
      </p>
      <h1 className="mt-2 font-display text-[clamp(2rem,5vw,2.9rem)] leading-[1.02] tracking-[-0.03em] text-ink">
        {meta.title}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-[1.65] text-ink/60">
        {meta.description}
      </p>

      <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6">
        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
          Planned in this module
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {meta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-moss/10 text-moss">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              <span className="text-[0.8125rem] leading-[1.55] text-ink/70">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-[0.75rem] leading-[1.6] text-ink/45">
        This module is part of the FurRescue data dictionary and is being wired
        to the live Supabase schema. Navigation and access control are already in
        place.
      </p>
    </div>
  );
}
