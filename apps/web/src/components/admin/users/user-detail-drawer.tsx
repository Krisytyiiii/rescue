"use client";

import {
  BadgeCheck,
  CalendarDays,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";

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

  function ask(next: UserStatus, title: string, description: string, confirmLabel: string, tone: ConfirmTone) {
    setPending({ status: next, title, description, confirmLabel, tone });
  }

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="user-detail-title"
      eyebrow="Account"
      title={user.fullName}
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
      panelClassName="max-w-xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center rounded-lg border border-ink/12 px-3.5 text-[0.75rem] font-medium text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
        >
          Close
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/[0.06] text-[0.75rem] font-semibold text-ink/60">
            {initials(user.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.875rem] font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-[0.75rem] text-ink/50">{user.email}</p>
          </div>
        </div>

        <FormAlert message={error} className="mt-4" />

        {loading && !detail && (
          <div className="mt-4 space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-lg bg-ink/[0.05]" />
            ))}
          </div>
        )}

        <Section title="Identity">
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow icon={Phone} label="Phone" value={user.phoneNumber ?? "—"} />
          <DetailRow icon={MapPin} label="Barangay" value={user.barangay ?? "Unassigned"} />
          <DetailRow
            icon={CalendarDays}
            label="Joined"
            value={dateFormatter.format(new Date(user.createdAt))}
          />
          <DetailRow icon={BadgeCheck} label="Email verified" value={user.emailVerifiedAt ? "Yes" : "No"} />
          <DetailRow icon={CalendarDays} label="Last login" value={formatLastLogin(user.lastLoginAt)} />
        </Section>

        {detail && (
          <Section title="Activity">
            <DetailRow icon={PawPrint} label="Reports submitted" value={String(detail.counts.reports)} />
            <DetailRow
              icon={ShieldCheck}
              label="Reports verified"
              value={String(detail.counts.verifiedReports)}
            />
            <DetailRow icon={UserCheck} label="Rescue assignments" value={String(detail.counts.rescues)} />
            <DetailRow
              icon={PawPrint}
              label="Adoption requests"
              value={String(detail.counts.adoptionRequests)}
            />
          </Section>
        )}

        <Section title="Access">
          {isSelf ? (
            <p className="text-[0.75rem] leading-[1.6] text-ink/50">
              You can’t change the status of your own account.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {status === "pending" && user.role === "rescuer" && (
                <ActionButton
                  label="Approve"
                  tone="success"
                  onClick={() => {
                    onApprove(user.id, status);
                    onClose();
                  }}
                />
              )}
              {status === "active" && (
                <>
                  <ActionButton
                    label="Suspend"
                    tone="danger"
                    onClick={() =>
                      ask(
                        "suspended",
                        "Suspend this account?",
                        `${user.fullName} will be signed out and cannot sign in until reactivated.`,
                        "Suspend account",
                        "danger",
                      )
                    }
                  />
                  <ActionButton
                    label="Deactivate"
                    tone="danger"
                    onClick={() =>
                      ask(
                        "deactivated",
                        "Deactivate this account?",
                        `Access is removed permanently for ${user.fullName}. History is kept.`,
                        "Deactivate account",
                        "danger",
                      )
                    }
                  />
                </>
              )}
              {status === "suspended" && (
                <>
                  <ActionButton
                    label="Reactivate"
                    tone="success"
                    onClick={() =>
                      ask(
                        "active",
                        "Reactivate this account?",
                        `${user.fullName} will be able to sign in again.`,
                        "Reactivate",
                        "success",
                      )
                    }
                  />
                  <ActionButton
                    label="Deactivate"
                    tone="danger"
                    onClick={() =>
                      ask(
                        "deactivated",
                        "Deactivate this account?",
                        `Access is removed permanently for ${user.fullName}. History is kept.`,
                        "Deactivate account",
                        "danger",
                      )
                    }
                  />
                </>
              )}
              {status === "deactivated" && (
                <ActionButton
                  label="Reactivate"
                  tone="success"
                  onClick={() =>
                    ask(
                      "active",
                      "Reactivate this account?",
                      `${user.fullName} will be able to sign in again.`,
                      "Reactivate",
                      "success",
                    )
                  }
                />
              )}
              {status === "pending" && user.role !== "rescuer" && (
                <ActionButton
                  label="Deactivate"
                  tone="danger"
                  onClick={() =>
                    ask(
                      "deactivated",
                      "Deactivate this account?",
                      `Access is removed permanently for ${user.fullName}. History is kept.`,
                      "Deactivate account",
                      "danger",
                    )
                  }
                />
              )}
            </div>
          )}
        </Section>
      </div>

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
        {title}
      </h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-ink/[0.015] px-3 py-2 text-[0.75rem]">
      <span className="flex items-center gap-2 text-ink/50">
        <Icon className="h-3.5 w-3.5 text-ink/35" strokeWidth={1.8} />
        {label}
      </span>
      <span className="truncate text-right font-medium text-ink/75">{value}</span>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "success" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-lg px-3 text-[0.75rem] font-medium transition-colors ${
        tone === "danger"
          ? "bg-[#b42318]/10 text-[#991b1b] hover:bg-[#b42318]/15"
          : "bg-moss/10 text-moss hover:bg-moss/15"
      }`}
    >
      {label}
    </button>
  );
}
