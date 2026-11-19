"use client";

import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PawMark, Wordmark } from "@/components/brand";

interface AdminNavbarProps {
  onOpenMobile: () => void;
  admin: { fullName: string; email: string };
  unreadNotifications: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AdminNavbar({
  onOpenMobile,
  admin,
  unreadNotifications,
}: AdminNavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [unread, setUnread] = useState(unreadNotifications);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnread(unreadNotifications);
  }, [unreadNotifications]);

  // Keep the bell badge live without waiting for a full navigation.
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/admin/notifications/unread-count");
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: { unread?: number } };
        if (!cancelled && typeof payload.data?.unread === "number") {
          setUnread(payload.data.unread);
        }
      } catch {
        // Realtime is an enhancement; the server-rendered value remains.
      }
    }

    function handleRealtime() {
      void refresh();
    }

    window.addEventListener("admin:realtime", handleRealtime);
    return () => {
      cancelled = true;
      window.removeEventListener("admin:realtime", handleRealtime);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/85 backdrop-blur-md">
      <div className="relative overflow-hidden border-b border-ink/[0.06] bg-gradient-to-r from-[#fbf3e6] via-[#fdfbf7] to-white">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-[radial-gradient(120%_140%_at_0%_50%,rgba(201,154,78,0.16),transparent_70%)]" />
        <div className="relative flex h-9 items-center gap-2.5 px-4">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
          </span>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-clay/10 text-clay">
            <MessagesSquare className="h-3 w-3" strokeWidth={1.9} />
          </span>
          <span className="shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[#8a6420]">
            Community feed
          </span>
          <span aria-hidden="true" className="hidden h-3 w-px shrink-0 bg-ink/10 sm:block" />
          <p className="min-w-0 flex-1 truncate text-[0.6875rem] text-ink/50">
            Residents post animals for adoption. Review the feed and hide anything harmful.
          </p>
          <Link
            href="/admin/community"
            className="group/cta inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#c99a4e]/40 bg-white/70 px-2.5 py-1 text-[0.625rem] font-medium text-[#7a5212] transition-colors hover:border-[#c99a4e]/70 hover:bg-white"
          >
            Review feed
            <ArrowUpRight
              className="h-3 w-3 transition-transform duration-200 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>

      <div className="flex h-16 items-center gap-3 px-4">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={1.7} />
      </button>

      <Link
        href="/admin"
        aria-label="FuRescue admin"
        className="flex shrink-0 items-center gap-2 lg:hidden"
      >
        <PawMark className="h-6 w-6 text-ink" />
        <Wordmark />
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/admin/notifications"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
          className="relative grid h-9 w-9 place-items-center rounded-lg text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[0.5625rem] font-semibold leading-none text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={`flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors sm:pr-3 ${
            menuOpen ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]"
          }`}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clay/15 text-[0.6875rem] font-semibold uppercase tracking-wide text-clay"
          >
            {initials(admin.fullName)}
          </span>
          <span className="hidden min-w-0 text-left lg:block">
            <span className="block max-w-[180px] truncate text-[0.8125rem] font-medium leading-tight text-ink">
              {admin.fullName}
            </span>
            <span className="block text-[0.6875rem] leading-tight text-ink/45">
              Administrator
            </span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-ink/35 transition-transform duration-200 ${
              menuOpen ? "rotate-180" : ""
            }`}
            strokeWidth={1.9}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Account menu"
            className="absolute right-0 top-[calc(100%+8px)] w-[268px] origin-top-right overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_12px_32px_-8px_rgba(20,30,25,0.22),0_2px_8px_-2px_rgba(20,30,25,0.08)]"
          >
            <div className="border-b border-ink/[0.07] px-4 py-3.5">
              <p className="truncate text-[0.8125rem] font-semibold leading-tight text-ink">
                {admin.fullName}
              </p>
              <p className="mt-0.5 truncate text-[0.75rem] leading-tight text-ink/50">
                {admin.email}
              </p>
              <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-moss/[0.08] px-2 py-0.5 text-[0.625rem] font-medium text-moss">
                <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                Administrator access
              </span>
            </div>

            <div className="p-1.5">
              <Link
                href="/admin/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink"
              >
                <Settings className="h-4 w-4 text-ink/40" strokeWidth={1.8} />
                Settings
              </Link>
              <Link
                href="/"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink"
              >
                <ExternalLink className="h-4 w-4 text-ink/40" strokeWidth={1.8} />
                View public site
              </Link>
            </div>

            <div className="border-t border-ink/[0.07] p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] text-[#a04a35] transition-colors hover:bg-[#a04a35]/[0.07] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
    </header>
  );
}
