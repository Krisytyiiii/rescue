import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { RescuesConsole } from "@/components/admin/rescues/rescues-console";
import { rescuesService } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Report map — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminRescuesPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const data = await rescuesService.console();

  return (
    <div className="w-full">
      <AdminLiveRefresh />
      <RescuesConsole data={data} />
    </div>
  );
}
