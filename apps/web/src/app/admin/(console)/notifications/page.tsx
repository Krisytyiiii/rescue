import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authService, messagingService, type Actor } from "@furescue/core";

import { NotificationsConsole } from "@/components/admin/notifications/notifications-console";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Notifications — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminNotificationsPage() {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  const notifications = await fetchAllPages((page, pageSize) =>
    messagingService.listNotifications({ page, pageSize }, actor),
  );

  return (
    <div className="w-full">
      <NotificationsConsole notifications={notifications} />
    </div>
  );
}
