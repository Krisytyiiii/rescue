import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSupabaseRealtime } from "@/components/admin/supabase-realtime";
import { ToastProvider } from "@/components/ui/toast";
import { authService, messagingService } from "@furescue/core";

import { readSession } from "@/lib/auth/session";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  let admin;
  try {
    admin = await authService.me(session.sub);
  } catch {
    redirect("/admin/login");
  }

  const [pending, notificationCounts] = await Promise.all([
    authService.listPendingRescuers(),
    messagingService.getNotificationCounts({
      userId: admin.id,
      role: admin.role,
      barangayId: admin.barangayId,
    }),
  ]);

  return (
    <AdminShell
      admin={{ fullName: admin.fullName, email: admin.email }}
      pendingCount={pending.length}
      unreadNotifications={notificationCounts.unread}
    >
      <AdminSupabaseRealtime
        channelName="admin-realtime"
        tables={[
          "notifications",
          "reports",
          "rescue_operations",
          "adoption_requests",
          "messages",
        ]}
      />
      <ToastProvider>{children}</ToastProvider>
    </AdminShell>
  );
}
