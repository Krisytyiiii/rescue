import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { authService } from "@furescue/core";

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

  const pending = await authService.listPendingRescuers();

  return (
    <AdminShell
      admin={{ fullName: admin.fullName, email: admin.email }}
      pendingCount={pending.length}
    >
      {children}
    </AdminShell>
  );
}
