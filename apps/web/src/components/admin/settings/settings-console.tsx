"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  HardDrive,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  MapPin,
  Radio,
  ScrollText,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  UserRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SecondaryTabFilters } from "@/components/ui/secondary-tab-filters";
import { StatCard } from "@/components/ui/stat-card";

import { ChangePasswordDialog } from "./change-password-dialog";
import { ProfileEditDialog } from "./profile-edit-dialog";

import type {
  AdminProfileSummary,
  IntegrationRow,
  ProbeState,
  SettingsOverview,
} from "@furescue/core";

type SectionId = "overview" | "account" | "integrations" | "audit";

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof Database }> = [
  { id: "overview", label: "Overview", icon: Database },
  { id: "account", label: "Account & security", icon: UserRound },
  { id: "integrations", label: "Integrations", icon: Radio },
  { id: "audit", label: "Audit & retention", icon: ScrollText },
];

const ROADMAP: Array<{
  title: string;
  description: string;
  icon: typeof Database;
}> = [
  {
    title: "General defaults",
    description: "Organization name and public contact details.",
    icon: SlidersHorizontal,
  },
  {
    title: "Operations",
    description: "Interview venue, due windows, and follow-up lead time.",
    icon: Wrench,
  },
  {
    title: "Notifications",
    description: "Reminder toggles and daily admin digest schedule.",
    icon: Bell,
  },
  {
    title: "Media & storage",
    description: "Upload size limits and storage capability status.",
    icon: ImageIcon,
  },
  {
    title: "Barangay reference",
    description: "Searchable reference data with counts and coordinates.",
    icon: MapPin,
  },
];

const TIME = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const DATE = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string | null): string {
  return value ? DATE.format(new Date(value)) : "Not recorded";
}

function formatDateTime(value: string | null): string {
  return value ? TIME.format(new Date(value)) : "Not recorded";
}

function relative(value: string | null): string {
  if (!value) return "No events yet";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : formatDateTime(value);
}

function stateTone(state: ProbeState): BadgeTone {
  return state === "ok" ? "success" : state === "warn" ? "warning" : "neutral";
}

function stateLabel(state: ProbeState): string {
  return state === "ok" ? "Ready" : state === "warn" ? "Attention" : "Off";
}

export function SettingsConsole({
  data,
  initialSection,
}: {
  data: SettingsOverview;
  initialSection: SectionId;
}) {
  const [section, setSection] = useState<SectionId>(initialSection);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfileSummary>(data.admin);
  const profileBeforeEdit = useRef<AdminProfileSummary>(data.admin);

  function openProfileEditor() {
    profileBeforeEdit.current = profile;
    setProfileOpen(true);
  }

  function select(next: SectionId) {
    setSection(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/admin/settings?section=${next}`);
    }
  }

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_2px_12px_-4px_rgba(20,30,25,0.08)]">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-forest via-moss to-clay"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-moss/[0.06] blur-2xl"
        />
        <div className="relative flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-forest/[0.08] px-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-forest">
                <SlidersHorizontal className="h-3 w-3" strokeWidth={2} />
                System
              </span>
              <Badge
                tone={data.environment.nodeEnv === "production" ? "success" : "info"}
                surface="light"
                className="uppercase tracking-[0.08em]"
              >
                {data.environment.nodeEnv}
              </Badge>
            </div>
            <h1 className="mt-2.5 font-display text-[clamp(1.75rem,4vw,2.4rem)] leading-[1.04] tracking-[-0.03em] text-ink">
              Settings
            </h1>
            <p className="mt-1.5 max-w-[68ch] text-[0.8125rem] leading-[1.6] text-ink/55">
              Configuration, reference data, and integration status for the FuRescue admin
              console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/audit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 text-[0.75rem] font-medium text-ink/65 transition-colors hover:border-ink/25 hover:text-ink"
            >
              <ScrollText className="h-3.5 w-3.5" strokeWidth={1.8} />
              Audit history
            </Link>
            <button
              type="button"
              onClick={() => select("account")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-[0.75rem] font-medium text-paper transition-colors hover:bg-ink/90"
            >
              <KeyRound className="h-3.5 w-3.5" strokeWidth={1.8} />
              Security
            </button>
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <SecondaryTabFilters
          ariaLabel="Settings section"
          value={section}
          onChange={(value) => select(value as SectionId)}
          options={SECTIONS.map((item) => ({ id: item.id, label: item.label }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="hidden self-start rounded-xl border border-ink/[0.08] bg-white p-1.5 lg:sticky lg:top-24 lg:block"
        >
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = item.id === section;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] font-medium transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-ink/55 hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {section === "overview" && (
            <OverviewSection
              data={data}
              profile={profile}
              onOpenIntegrations={() => select("integrations")}
            />
          )}
          {section === "account" && (
            <AccountSection
              profile={profile}
              data={data}
              onEditProfile={openProfileEditor}
              onChangePassword={() => setPasswordOpen(true)}
            />
          )}
          {section === "integrations" && <IntegrationsSection rows={data.integrations} />}
          {section === "audit" && <AuditSection data={data} />}
        </div>
      </div>

      {passwordOpen && <ChangePasswordDialog onClose={() => setPasswordOpen(false)} />}
      {profileOpen && (
        <ProfileEditDialog
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={(next) =>
            setProfile((current) => ({
              ...current,
              ...next,
              fullName: [next.firstName, next.middleName, next.lastName]
                .filter(Boolean)
                .join(" "),
            }))
          }
          onRevert={() => setProfile(profileBeforeEdit.current)}
        />
      )}
    </div>
  );
}

function Card({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-ink/[0.07] px-4 py-3">
        <div>
          <h2 className="text-[0.875rem] font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 max-w-[62ch] text-[0.6875rem] leading-[1.55] text-ink/45">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function BannerCard({
  eyebrow,
  title,
  icon: Icon,
  accent = "moss",
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Database;
  accent?: "moss" | "forest" | "clay" | "amber";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const accents = {
    moss: {
      rule: "from-moss/70 via-moss/25 to-transparent",
      wash: "from-moss/[0.07]",
      icon: "bg-moss/10 text-moss",
      eyebrow: "text-moss",
    },
    forest: {
      rule: "from-forest/70 via-forest/25 to-transparent",
      wash: "from-forest/[0.07]",
      icon: "bg-forest/10 text-forest",
      eyebrow: "text-forest",
    },
    clay: {
      rule: "from-clay/70 via-clay/25 to-transparent",
      wash: "from-clay/[0.07]",
      icon: "bg-clay/10 text-clay",
      eyebrow: "text-clay",
    },
    amber: {
      rule: "from-[#c99a4e]/70 via-[#c99a4e]/25 to-transparent",
      wash: "from-[#c99a4e]/[0.09]",
      icon: "bg-[#c99a4e]/12 text-[#a87a34]",
      eyebrow: "text-[#a87a34]",
    },
  }[accent];

  return (
    <section className="relative overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accents.rule}`}
      />
      <div
        className={`flex flex-wrap items-start justify-between gap-2 bg-gradient-to-b ${accents.wash} to-transparent px-4 pb-3 pt-4`}
      >
        <div className="flex items-start gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${accents.icon}`}>
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div>
            <p className={`text-[0.5625rem] font-semibold uppercase tracking-[0.12em] ${accents.eyebrow}`}>
              {eyebrow}
            </p>
            <h2 className="mt-0.5 text-[0.9375rem] font-semibold text-ink">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/[0.05] py-2 last:border-b-0">
      <dt className="text-[0.6875rem] text-ink/45">{label}</dt>
      <dd className="min-w-0 text-right text-[0.75rem] font-medium text-ink/75">{value}</dd>
    </div>
  );
}

function OverviewSection({
  data,
  profile,
  onOpenIntegrations,
}: {
  data: SettingsOverview;
  profile: AdminProfileSummary;
  onOpenIntegrations: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          label="Database"
          value={data.status.database.label}
          hint={data.status.database.detail}
          icon={Database}
          tone="forest"
        />
        <StatCard
          label="Storage"
          value={data.status.storage.label}
          hint={data.status.storage.detail}
          icon={HardDrive}
          tone="clay"
        />
        <StatCard
          label="Realtime"
          value={data.status.realtime.label}
          hint={data.status.realtime.detail}
          icon={Radio}
          tone="moss"
        />
        <StatCard
          label="Audit trail"
          value={data.status.audit.label}
          hint={`${data.status.audit.last24h} event${data.status.audit.last24h === 1 ? "" : "s"} in 24h`}
          icon={ScrollText}
          tone="amber"
        />
      </div>

      <BannerCard
        eyebrow="Runtime"
        title="Environment"
        icon={Server}
        accent="forest"
        action={
          <Badge tone="neutral" surface="light" className="uppercase tracking-[0.08em]">
            Read-only
          </Badge>
        }
      >
        <dl>
          <Row label="Application" value={data.environment.appName} />
          <Row
            label="Environment"
            value={<span className="capitalize">{data.environment.nodeEnv}</span>}
          />
          <Row label="App URL" value={data.environment.appUrl} />
          <Row label="Timezone" value={data.environment.timezone} />
          <Row label="Signed in as" value={`${profile.fullName} · ${profile.role}`} />
        </dl>
      </BannerCard>

      <Card
        title="Planned configuration areas"
        description="These panels ship as they are wired to live behaviour. Phase 1 is available now."
        action={
          <Badge tone="info" surface="light" className="uppercase tracking-[0.08em]">
            Roadmap
          </Badge>
        }
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {ROADMAP.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-ink/[0.08] bg-ink/[0.012] p-3 transition-colors hover:border-ink/15 hover:bg-white"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-moss/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-ink/[0.06] bg-white text-ink/45">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[0.8125rem] font-medium text-ink/80">{item.title}</p>
                      <span className="shrink-0 font-mono text-[0.5625rem] tracking-[0.08em] text-ink/25">
                        P{index + 2}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/45">
                      {item.description}
                    </p>
                  </div>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/[0.04] px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.09em] text-ink/40">
                  Planned
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/[0.06] pt-3">
          <p className="text-[0.6875rem] text-ink/40">
            Phase 1 configuration and account controls are live today.
          </p>
          <Button size="sm" variant="ghost" onClick={onOpenIntegrations}>
            Review integrations
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.9} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AccountSection({
  profile,
  data,
  onEditProfile,
  onChangePassword,
}: {
  profile: AdminProfileSummary;
  data: SettingsOverview;
  onEditProfile: () => void;
  onChangePassword: () => void;
}) {
  const admin = profile;
  const session = data.integrations.find((row) => row.label === "Session lifetime");

  return (
    <div className="space-y-4">
      <BannerCard
        eyebrow="Your account"
        title="Signed-in administrator"
        icon={UserRound}
        accent="clay"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/users?q=${encodeURIComponent(admin.email)}`}
              className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-ink/50 transition-colors hover:text-ink"
            >
              Open account
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            </Link>
            <Button size="sm" variant="secondary" onClick={onEditProfile}>
              Edit profile
            </Button>
          </div>
        }
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-clay/10 text-[0.8125rem] font-semibold text-clay ring-1 ring-inset ring-clay/15">
            {admin.profilePhotoUrl ? (
              <img
                src={admin.profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.875rem] font-semibold text-ink">
              {admin.fullName}
            </p>
            <p className="truncate text-[0.6875rem] text-ink/45">{admin.email}</p>
          </div>
        </div>
        <dl>
          <Row label="Full name" value={admin.fullName} />
          <Row label="Email" value={admin.email} />
          <Row
            label="Phone"
            value={admin.phoneNumber ?? <span className="text-ink/35">Not set</span>}
          />
          <Row label="Role" value={<span className="capitalize">{admin.role.replaceAll("_", " ")}</span>} />
          <Row label="Account status" value={<span className="capitalize">{admin.accountStatus}</span>} />
          <Row label="Barangay" value={admin.barangay ?? "Unassigned"} />
          <Row label="Last login" value={formatDateTime(admin.lastLoginAt)} />
          <Row label="Member since" value={formatDate(admin.createdAt)} />
        </dl>
      </BannerCard>

      <Card
        title="Password"
        description="Use a unique password. Changing it writes an audit entry to your account history."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/[0.04] text-ink/45">
              <KeyRound className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[0.8125rem] font-medium text-ink/75">Account password</p>
              <p className="mt-0.5 max-w-[48ch] text-[0.6875rem] leading-[1.55] text-ink/45">
                You will need your current password to set a new one.
              </p>
            </div>
          </div>
          <Button size="md" variant="secondary" onClick={onChangePassword}>
            Change password
          </Button>
        </div>
      </Card>

      <Card title="Session" description="How long this browser stays signed in and how to end it.">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/[0.07] bg-ink/[0.015] p-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-ink/45">
              <Timer className="h-3.5 w-3.5" strokeWidth={1.9} />
            </span>
            <p className="mt-2 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Session lifetime
            </p>
            <p className="mt-1 font-display text-[1.25rem] leading-none text-ink">
              {session?.value ?? "7d"}
            </p>
            <p className="mt-1 text-[0.625rem] text-ink/40">Then re-authenticate</p>
          </div>
          <div className="rounded-xl border border-ink/[0.07] bg-ink/[0.015] p-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-ink/45">
              <UserRound className="h-3.5 w-3.5" strokeWidth={1.9} />
            </span>
            <p className="mt-2 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Last sign-in
            </p>
            <p className="mt-1 text-[0.8125rem] font-semibold text-ink/80">
              {formatDateTime(admin.lastLoginAt)}
            </p>
            <p className="mt-1 text-[0.625rem] text-ink/40">This device</p>
          </div>
          <div className="rounded-xl border border-ink/[0.07] bg-ink/[0.015] p-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-ink/45">
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} />
            </span>
            <p className="mt-2 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Sign out
            </p>
            <p className="mt-1 text-[0.8125rem] font-semibold text-ink/80">Account menu</p>
            <p className="mt-1 text-[0.625rem] text-ink/40">Top-right corner</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function IntegrationsSection({ rows }: { rows: IntegrationRow[] }) {
  return (
    <Card
      title="Integrations & environment"
      description="Values are set through environment variables. Secrets are never shown here."
    >
      <div className="mb-3 flex items-start gap-2 rounded-lg bg-[#1f7a4d]/[0.06] px-3 py-2 text-[0.6875rem] leading-[1.55] text-[#16603b]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
        This panel reports status only. It cannot display or edit keys, passwords, or
        connection strings.
      </div>

      <ul className="divide-y divide-ink/[0.06]">
        {rows.map((row) => {
          const Icon =
            row.state === "ok" ? CheckCircle2 : row.state === "warn" ? CircleAlert : CircleAlert;
          return (
            <li key={row.label} className="flex items-start justify-between gap-4 py-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                    row.state === "ok"
                      ? "bg-moss/10 text-moss"
                      : row.state === "warn"
                        ? "bg-[#b45309]/10 text-[#92400e]"
                        : "bg-ink/[0.05] text-ink/35"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-medium text-ink/75">{row.label}</p>
                  <p className="mt-0.5 text-[0.6875rem] leading-[1.5] text-ink/40">{row.hint}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  tone={stateTone(row.state)}
                  surface="light"
                  className="uppercase tracking-[0.06em]"
                >
                  {row.value}
                </Badge>
                <span className="text-[0.5625rem] uppercase tracking-[0.08em] text-ink/30">
                  {stateLabel(row.state)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AuditSection({ data }: { data: SettingsOverview }) {
  return (
    <div className="space-y-4">
      <Card
        title="Audit trail"
        description="Every administrative change is appended to the audit ledger and cannot be edited."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Last event
            </p>
            <p className="mt-1.5 text-[0.875rem] font-semibold text-ink/80">
              {relative(data.status.audit.lastAt)}
            </p>
            <p className="mt-0.5 text-[0.625rem] text-ink/40">
              {formatDateTime(data.status.audit.lastAt)}
            </p>
          </div>
          <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Last 24 hours
            </p>
            <p className="mt-1.5 font-display text-[1.4rem] leading-none text-ink">
              {data.status.audit.last24h}
            </p>
            <p className="mt-0.5 text-[0.625rem] text-ink/40">Recorded actions</p>
          </div>
          <div className="rounded-lg border border-ink/[0.07] bg-ink/[0.015] p-3">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-ink/35">
              Retention
            </p>
            <p className="mt-1.5 text-[0.875rem] font-semibold text-ink/80">Indefinite</p>
            <p className="mt-0.5 text-[0.625rem] text-ink/40">Append-only history</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/audit"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 text-[0.6875rem] font-medium text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
          >
            <ScrollText className="h-3.5 w-3.5" strokeWidth={1.8} />
            Browse audit logs
          </Link>
          <a
            href="/api/admin/audit/export"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 text-[0.6875rem] font-medium text-ink/60 transition-colors hover:border-ink/25 hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Export CSV
          </a>
        </div>
      </Card>

      <Card title="What gets recorded" description="Settings writes will use the same append-only ledger.">
        <ul className="space-y-1.5 text-[0.75rem] leading-[1.6] text-ink/55">
          <li>• Account approvals, suspensions, and password changes.</li>
          <li>• Report, rescue, animal, health, adoption, and messaging actions.</li>
          <li>• Future configuration changes, with before and after values.</li>
        </ul>
      </Card>
    </div>
  );
}
