"use client";

import { useState } from "react";

import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminShellProps {
  admin: { fullName: string; email: string; profilePhotoUrl?: string | null };
  pendingCount: number;
  unreadNotifications: number;
  children: React.ReactNode;
}

export function AdminShell({
  admin,
  pendingCount,
  unreadNotifications,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-gradient-to-br from-[#f2faf4] via-[#fbfefb] to-white">
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

      <div className="flex min-h-dvh w-full min-w-0 flex-col lg:pl-[236px]">
        <AdminNavbar
          onOpenMobile={() => setMobileOpen(true)}
          admin={admin}
          unreadNotifications={unreadNotifications}
        />

        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-clip p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
