import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authService, learningService, type Actor } from "@furescue/core";

import { AdminLiveRefresh } from "@/components/admin/admin-live-refresh";
import { LearningConsole } from "@/components/admin/learning/learning-console";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "E-learning — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminLearningPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  const modules = await learningService.listModules(actor);

  return (
    <div className="w-full">
      <AdminLiveRefresh />
      <LearningConsole modules={modules} />
    </div>
  );
}
