import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authService, settingsService, type Actor } from "@furescue/core";

import { SettingsConsole } from "@/components/admin/settings/settings-console";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings — FuRescue admin",
  robots: { index: false, follow: false },
};

const SECTIONS = ["overview", "account", "integrations", "audit"] as const;
type SectionId = (typeof SECTIONS)[number];

function parseSection(value: string | undefined): SectionId {
  return SECTIONS.includes(value as SectionId) ? (value as SectionId) : "overview";
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  const [data, params] = await Promise.all([
    settingsService.overview(actor),
    searchParams,
  ]);

  return (
    <div className="w-full">
      <SettingsConsole data={data} initialSection={parseSection(params.section)} />
    </div>
  );
}
