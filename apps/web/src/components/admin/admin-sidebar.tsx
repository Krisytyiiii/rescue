"use client";

import {
  BarChart3,
  FileWarning,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  PawPrint,
  ScrollText,
  Settings,
  Siren,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PawMark, Wordmark } from "@/components/brand";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Badges cap at 9+ so the narrow sidebar stays readable. */
const BADGE_CAP = 9;
const SEEN_KEY = "furescue:admin-nav-seen";
const POLL_MS = 20_000;

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/reports", label: "Reports", icon: FileWarning },
      { href: "/admin/rescues", label: "Rescue operations", icon: Siren },
      { href: "/admin/animals", label: "Animals", icon: PawPrint },
    ],
  },
  {
    label: "Welfare",
    items: [
      { href: "/admin/health", label: "Health records", icon: Stethoscope },
      { href: "/admin/adoptions", label: "Adoptions", icon: HeartHandshake },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/community", label: "Community feed", icon: Newspaper },
      { href: "/admin/users", label: "Users & access", icon: Users },
      { href: "/admin/messaging", label: "Chat", icon: MessageSquare },
      { href: "/admin/learning", label: "E-learning", icon: GraduationCap },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/audit", label: "Audit logs", icon: ScrollText },
    ],
  },
];

const FOOTER_ITEM: NavItem = {
  href: "/admin/settings",
  label: "Settings",
  icon: Settings,
};

interface AdminSidebarProps {
  mobileOpen: boolean;
  pendingCount: number;
  onCloseMobile: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  unseen,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  unseen: number;
  onNavigate: (href: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={() => onNavigate(item.href)}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] transition-colors ${
        active
          ? "bg-clay/[0.08] font-medium text-ink"
          : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 h-4 w-[3px] rounded-r-full bg-clay transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${active ? "text-clay" : "text-ink/40 group-hover:text-ink/70"}`}
        strokeWidth={1.7}
      />

      <span className="truncate">{item.label}</span>

      {unseen > 0 && (
        <span className="ml-auto rounded-full bg-[#d64545] px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-white">
          {unseen > BADGE_CAP ? `${BADGE_CAP}+` : unseen}
        </span>
      )}
    </Link>
  );
}

const ALL_HREFS = [
  ...NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
  FOOTER_ITEM.href,
];

function readSeen(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

export function AdminSidebar({
  mobileOpen,
  pendingCount,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Record<string, number>>({
    "/admin/users": pendingCount,
  });
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [seenLoaded, setSeenLoaded] = useState(false);

  useEffect(() => {
    setSeen(readSeen());
    setSeenLoaded(true);
  }, []);

  // Poll for live counts and refresh immediately when Supabase reports a change.
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/admin/nav-counts", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          data?: { counts?: Record<string, number> };
        };
        if (!cancelled && payload.data?.counts) setCounts(payload.data.counts);
      } catch {
        // Realtime is an enhancement; keep the last known counts.
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    const handleRealtime = () => void refresh();
    window.addEventListener("admin:realtime", handleRealtime);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("admin:realtime", handleRealtime);
    };
  }, []);

  const markSeen = useCallback(
    (href: string) => {
      setSeen((current) => {
        const next = { ...current, [href]: counts[href] ?? 0 };
        try {
          window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
        } catch {
          // Storage is optional; the in-memory state still clears the badge.
        }
        return next;
      });
    },
    [counts],
  );

  const navigate = useCallback(
    (href: string) => {
      markSeen(href);
      onCloseMobile();
    },
    [markSeen, onCloseMobile],
  );

  // Landing on a page clears its badge without needing a click.
  useEffect(() => {
    if (!seenLoaded) return;
    const active = ALL_HREFS.find((href) => isActive(pathname, href));
    if (active) markSeen(active);
  }, [pathname, seenLoaded, markSeen]);

  const unseenFor = (href: string) =>
    Math.max(0, (counts[href] ?? 0) - (seen[href] ?? 0));

  return (
    <aside
      aria-label="Admin navigation"
      className={`group fixed inset-y-0 left-0 z-50 flex w-[min(248px,85vw)] flex-col border-r border-ink/[0.08] bg-white text-ink transition-transform duration-300 ease-out lg:w-[236px] lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-clay/60"
          aria-label="FuRescue admin dashboard"
        >
          <PawMark className="h-7 w-7 shrink-0 text-clay" />
          <span>
            <Wordmark />
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-on-hover">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  unseen={unseenFor(item.href)}
                  onNavigate={navigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ink/[0.08] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-3">
        <NavLink
          item={FOOTER_ITEM}
          active={isActive(pathname, FOOTER_ITEM.href)}
          unseen={unseenFor(FOOTER_ITEM.href)}
          onNavigate={navigate}
        />
        <p className="mt-3 px-3 text-[0.5625rem] leading-[1.6] text-ink/35">
          FurRescue · Mati City
          <br />
          City Vet animal welfare office
        </p>
      </div>
    </aside>
  );
}
