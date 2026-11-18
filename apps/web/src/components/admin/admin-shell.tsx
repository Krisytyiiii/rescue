"use client";

import { useState } from "react";

import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminShellProps {
  admin: { fullName: string; email: string };
  pendingCount: number;
  children: React.ReactNode;
}

export function AdminShell({ admin, pendingCount, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#f4f8fe] via-[#fbfcff] to-white">
      <AdminSidebar
        mobileOpen={mobileOpen}
        pendingCount={pendingCount}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <div className="flex min-h-dvh flex-col lg:pl-[236px]">
        <AdminNavbar
          onOpenMobile={() => setMobileOpen(true)}
          admin={admin}
        />

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
