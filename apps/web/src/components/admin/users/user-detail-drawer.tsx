"use client";

import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  Mail,
  MapPin,
  PawPrint,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  PauseCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ROLE_LABELS,
  ROLE_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  dateFormatter,
  formatLastLogin,
  initials,
  type UserDetail,
  type UserRow,
  type UserStatus,
} from "./users-types";

interface UserDetailDrawerProps {
  userId: string;
  fallback: UserRow;
  currentUserId: string;
  onClose: () => void;
  onStatusChange: (id: string, next: UserStatus, previous: UserStatus) => void;
  onApprove: (id: string, previous: UserStatus) => void;
}

interface PendingAction {
  status: UserStatus;
  title: string;
  description: string;
  confirmLabel: string;
  tone: ConfirmTone;
}

export function UserDetailDrawer({
  userId,
  fallback,
  currentUserId,
  onClose,
  onStatusChange,
  onApprove,
}: UserDetailDrawerProps) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const body = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok) {
          setError(body?.error?.message ?? "Could not load this account.");
          return;
        }
        setDetail(body?.data ?? null);
      } catch {
        if (active) setError("Could not load this account. Try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  const user = detail ?? fallback;
  const status = user.accountStatus;
  const isSelf = user.id === currentUserId;

  function ask(
    next: UserStatus,
    title: string,
    description: string,
    confirmLabel: string,
    tone: ConfirmTone,
  ) {
    setPending({ status: next, title, description, confirmLabel, tone });
  }

  const actions: Array<{
    label: string;
    icon: LucideIcon;
    tone: "success" | "danger";
    onClick: () => void;
  }> = [];

  if (!isSelf) {
    if (status === "pending" && user.role === "rescuer") {
      actions.push({
        label: "Approve account",
        icon: CheckCircle2,
        tone: "success",
        onClick: () => {
          onApprove(user.id, status);
          onClose();
        },
      });
    }

    if (status === "active") {
      actions.push(
        {
          label: "Suspend",
          icon: PauseCircle,
          tone: "danger",
          onClick: () =>
            ask(
              "suspended",
              "Suspend this account?",
              `${user.fullName} will be signed out and cannot sign in until reactivated.`,
              "Suspend account",
              "danger",
            ),
        },
        {
          label: "Deactivate",
          icon: UserX,
          tone: "danger",
          onClick: () =>
            ask(
              "deactivated",
              "Deactivate this account?",
              `Access is removed permanently for ${user.fullName}. History is kept.`,
              "Deactivate account",
              "danger",
            ),
        },
      );
    }

    if (status === "suspended" || status === "deactivated") {
      actions.push({
        label: "Reactivate",
        icon: RotateCcw,
        tone: "success",
        onClick: () =>
          ask(
            "active",
            "Reactivate this account?",
            `${user.fullName} will be able to sign in again.`,
            "Reactivate account",
            "success",
          ),
      });
    }

    if (status === "suspended" || (status === "pending" && user.role !== "rescuer")) {
      actions.push({
        label: "Deactivate",
        icon: UserX,
        tone: "danger",
        onClick: () =>
          ask(
            "deactivated",
            "Deactivate this account?",
            `Access is removed permanently for ${user.fullName}. History is kept.`,
            "Deactivate account",
            "danger",
          ),
      });
    }
  }

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="user-detail-title"
      eyebrow="Account"
      title={user.fullName}
      titleClassName="text-[0.9375rem] font-semibold leading-tight tracking-tight text-ink"
      meta={
        <>
          <Badge tone={ROLE_TONES[user.role]} surface="light">
            {ROLE_LABELS[user.role]}
          </Badge>
          <Badge tone={STATUS_TONES[status]} surface="light">
            {STATUS_LABELS[status]}
          </Badge>
          {isSelf && (
            <Badge tone="info" surface="light">
              You
            </Badge>
          )}
        </>
      }
      panelClassName="max-w-2xl"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-5 py-5">
          <div className="relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-ink/[0.07] bg-white p-4">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-clay/[0.07] via-transparent to-transparent"
            />
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-clay/10 text-[0.8125rem] font-semibold text-clay ring-1 ring-inset ring-clay/15">
              {initials(user.fullName)}
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-semibold text-ink">
                {user.fullName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.75rem] text-ink/50">
                <Mail className="h-3 w-3 shrink-0 text-ink/30" strokeWidth={1.8} />
                {user.email}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.75rem] text-ink/50">
                <MapPin className="h-3 w-3 shrink-0 text-ink/30" strokeWidth={1.8} />
                {user.barangay ?? "Barangay not set"}
              </p>
            </div>
          </div>

          <FormAlert message={error} />

          <section>
            <SectionTitle icon={UserRound} label="Identity" />
            <dl className="mt-2.5 grid gap-px overflow-hidden rounded-xl border border-ink/[0.07] bg-ink/[0.06] sm:grid-cols-2">
              <InfoCell label="Email" value={user.email} />
              <InfoCell label="Phone" value={user.phoneNumber ?? "Not provided"} />
              <InfoCell label="Barangay" value={user.barangay ?? "Unassigned"} />
              <InfoCell
                label="Joined"
                value={dateFormatter.format(new Date(user.createdAt))}
              />
              <InfoCell
                label="Email verified"
                value={user.emailVerifiedAt ? "Verified" : "Not verified"}
              />
              <InfoCell label="Last login" value={formatLastLogin(user.lastLoginAt)} />
            </dl>
          </section>

          <section>
            <SectionTitle icon={Activity} label="Activity" />
            {detail ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCell
                  icon={PawPrint}
                  label="Reports"
                  value={detail.counts.reports}
                />
                <StatCell
                  icon={ShieldCheck}
                  label="Verified"
                  value={detail.counts.verifiedReports}
                />
                <StatCell
                  icon={UserCheck}
                  label="Assignments"
                  value={detail.counts.rescues}
                />
                <StatCell
                  icon={BadgeCheck}
                  label="Applications"
                  value={detail.counts.adoptionRequests}
                />
              </div>
            ) : (
              <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={`h-[4.5rem] animate-pulse rounded-xl bg-ink/[0.04] ${
                      loading ? "" : "opacity-50"
                    }`}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle icon={ShieldCheck} label="Access" />
            <div className="mt-2.5 flex flex-col gap-3 rounded-xl border border-ink/[0.07] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-[0.75rem] leading-[1.6] text-ink/50">
                {isSelf
                  ? "You can’t change the status of your own account."
                  : status === "active"
                    ? "This account can sign in normally. Suspend to block sign-in, or deactivate to close access permanently."
                    : status === "pending"
                      ? "This account is waiting for approval before it can be used."
                      : "This account cannot sign in. Reactivate it to restore access."}
              </p>
              {actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.label}
                        size="sm"
                        variant={action.tone === "danger" ? "dangerGhost" : "primary"}
                        onClick={action.onClick}
                      >
                        <Icon className="h-3 w-3" strokeWidth={2} />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(value) => {
          if (!value) setPending(null);
        }}
        tone={pending?.tone ?? "default"}
        title={pending?.title ?? ""}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel}
        onConfirm={() => {
          if (!pending) return;
          const action = pending;
          setPending(null);
          onStatusChange(user.id, action.status, status);
        }}
      />
    </OverlayCard>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
      <Icon className="h-3.5 w-3.5 text-ink/30" strokeWidth={1.9} />
      {label}
    </h3>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-3.5 py-3">
      <dt className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[0.8125rem] leading-[1.5] text-ink/75">
        {value}
      </dd>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.07] bg-white px-3 py-2.5">
      <Icon className="h-3.5 w-3.5 text-ink/30" strokeWidth={1.9} />
      <p className="mt-1.5 font-mono text-[1rem] font-semibold tabular-nums leading-none text-ink/80">
        {value}
      </p>
      <p className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
        {label}
      </p>
    </div>
  );
}
