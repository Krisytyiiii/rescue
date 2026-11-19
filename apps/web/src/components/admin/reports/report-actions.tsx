"use client";

import { Loader2, ShieldCheck, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";

const REJECTION_REASONS = [
  { value: "Duplicate of another report", label: "Duplicate", hint: "Already reported" },
  {
    value: "Insufficient information",
    label: "Insufficient info",
    hint: "Missing useful details",
  },
  {
    value: "Not an animal emergency",
    label: "Not an emergency",
    hint: "Outside rescue scope",
  },
  { value: "False or spam report", label: "False or spam", hint: "Invalid submission" },
];

interface ActiveRescuer {
  id: string;
  fullName: string;
  email: string;
}

type PendingAction = "verify" | "reject" | "assign";

interface ReportActionsProps {
  id: string;
  status: string;
  onDone?: () => void;
  /** Called immediately so the surrounding UI can update before the request finishes. */
  onOptimisticStatus?: (status: string) => void;
  onActionError?: (message: string) => void;
}

/**
 * Inline verification/assignment controls for a report. Every action is
 * confirmed in an overlay; on confirm the overlay closes and the UI updates
 * optimistically while the request continues in the background.
 */
export function ReportActions({
  id,
  status,
  onDone,
  onOptimisticStatus,
  onActionError,
}: ReportActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const [rescuers, setRescuers] = useState<ActiveRescuer[] | null>(null);
  const [loadingRescuers, setLoadingRescuers] = useState(false);
  const [rescuersError, setRescuersError] = useState("");
  const [selectedRescuer, setSelectedRescuer] = useState("");

  const canVerify = status === "submitted";
  // Once verified, the report is waiting for rescuer assignment — no reject action.
  const canReject = status === "submitted";
  const canAssign = status === "verified";

  function reportError(message: string) {
    if (onActionError) onActionError(message);
    else setError(message);
  }

  async function loadRescuers() {
    setLoadingRescuers(true);
    setRescuersError("");
    try {
      const response = await fetch("/api/admin/rescuers?status=active");
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setRescuersError(body?.error?.message ?? "Could not load active rescuers.");
        return;
      }
      setRescuers(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setRescuersError("Could not load active rescuers. Try again.");
    } finally {
      setLoadingRescuers(false);
    }
  }

  function open(action: PendingAction) {
    setReason("");
    setError("");
    setSelectedRescuer("");
    setRescuersError("");
    setConfirming(action);
    if (action === "assign" && rescuers === null) void loadRescuers();
  }

  async function submit(action: "verify" | "reject", rejectionReason?: string) {
    try {
      const response = await fetch(`/api/admin/reports/${id}/${action}`, {
        method: "POST",
        ...(action === "reject"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason: rejectionReason }),
            }
          : {}),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        onOptimisticStatus?.(status);
        reportError(body?.error?.message ?? "Could not update this report. Try again.");
        return;
      }

      router.refresh();
    } catch {
      onOptimisticStatus?.(status);
      reportError("Network error. Check your connection and try again.");
    }
  }

  async function submitAssignment(rescuerUserId: string) {
    try {
      const response = await fetch(`/api/admin/reports/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rescuerUserId }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        onOptimisticStatus?.(status);
        reportError(body?.error?.message ?? "Could not assign this report. Try again.");
        return;
      }

      router.refresh();
    } catch {
      onOptimisticStatus?.(status);
      reportError("Network error. Check your connection and try again.");
    }
  }

  function confirm() {
    if (!confirming) return;
    if (confirming === "reject" && !reason) return;
    if (confirming === "assign" && !selectedRescuer) return;

    const action = confirming;
    const nextStatus =
      action === "verify" ? "verified" : action === "reject" ? "rejected" : "assigned";

    // Close instantly and update optimistically; the request runs in the background.
    setConfirming(null);
    setError("");
    onOptimisticStatus?.(nextStatus);
    onDone?.();

    if (action === "assign") {
      void submitAssignment(selectedRescuer);
    } else {
      void submit(action, action === "reject" ? reason : undefined);
    }
  }

  if (!canVerify && !canReject && !canAssign) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {canAssign ? (
        <button
          type="button"
          onClick={() => open("assign")}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-3 text-[0.75rem] font-medium text-paper transition-colors hover:bg-moss"
        >
          <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Assign rescuer
        </button>
      ) : (
        <div className="flex gap-2">
          {canVerify && (
            <button
              type="button"
              onClick={() => open("verify")}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 text-[0.75rem] font-medium text-paper transition-colors hover:bg-moss"
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Verify
            </button>
          )}

          {canReject && (
            <button
              type="button"
              onClick={() => open("reject")}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/12 px-3 text-[0.75rem] font-medium text-ink/55 transition-colors hover:border-clay/30 hover:text-clay"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Reject
            </button>
          )}
        </div>
      )}

      <FormAlert message={error} className="mt-2" />

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(value) => {
          if (!value) setConfirming(null);
        }}
        tone={confirming === "reject" ? "danger" : confirming === "assign" ? "default" : "success"}
        title={
          confirming === "reject"
            ? "Reject this report?"
            : confirming === "assign"
              ? "Assign a rescuer?"
              : "Verify this report?"
        }
        description={
          confirming === "reject"
            ? "The report will be marked as rejected and the reporter notified. Choose a reason to continue."
            : confirming === "assign"
              ? "Select an active rescuer to handle this report. They will be notified immediately."
              : "The report will move to Verified and become ready for rescue assignment."
        }
        confirmLabel={
          confirming === "reject"
            ? "Reject report"
            : confirming === "assign"
              ? "Assign report"
              : "Verify report"
        }
        confirmDisabled={
          (confirming === "reject" && !reason) ||
          (confirming === "assign" && (loadingRescuers || !selectedRescuer))
        }
        onConfirm={confirm}
      >
        {confirming === "reject" && (
          <div className="mb-4 grid gap-1.5" role="radiogroup" aria-label="Rejection reason">
            {REJECTION_REASONS.map((option) => {
              const selected = reason === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setReason(option.value)}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border-clay/45 bg-clay/[0.05] text-ink"
                      : "border-ink/[0.08] text-ink/70 hover:border-ink/20 hover:bg-ink/[0.02]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[0.75rem] font-medium">{option.label}</span>
                    <span className="block text-[0.625rem] text-ink/45">{option.hint}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      selected ? "border-clay bg-clay" : "border-ink/25"
                    }`}
                  >
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {confirming === "assign" && (
          <div className="mb-4">
            {loadingRescuers && (
              <p className="flex items-center justify-center gap-2 rounded-lg border border-ink/[0.08] px-3 py-6 text-[0.75rem] text-ink/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading active rescuers…
              </p>
            )}

            <FormAlert message={rescuersError} className="mt-0" />

            {!loadingRescuers && rescuers && rescuers.length === 0 && (
              <p className="rounded-lg border border-dashed border-ink/15 px-3 py-6 text-center text-[0.75rem] text-ink/50">
                No active rescuers yet. Approve a rescuer first.
              </p>
            )}

            {!loadingRescuers && rescuers && rescuers.length > 0 && (
              <div
                className="grid max-h-56 gap-1.5 overflow-y-auto"
                role="radiogroup"
                aria-label="Active rescuers"
              >
                {rescuers.map((rescuer) => {
                  const selected = selectedRescuer === rescuer.id;
                  return (
                    <button
                      key={rescuer.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedRescuer(rescuer.id)}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-clay/45 bg-clay/[0.05] text-ink"
                          : "border-ink/[0.08] text-ink/70 hover:border-ink/20 hover:bg-ink/[0.02]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[0.75rem] font-medium">
                          {rescuer.fullName}
                        </span>
                        <span className="block truncate text-[0.625rem] text-ink/45">
                          {rescuer.email}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          selected ? "border-clay bg-clay" : "border-ink/25"
                        }`}
                      >
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
