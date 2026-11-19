"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormAlert } from "@/components/ui/form-alert";

interface PendingRescuer {
  id: string;
  fullName: string;
  email: string;
  appliedAt: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatApplied(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PendingRescuerList({ rescuers }: { rescuers: PendingRescuer[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<PendingRescuer | null>(null);
  const [approved, setApproved] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function approve(id: string) {
    setError("");
    // Update immediately; the request continues in the background.
    setApproved((current) => [...current, id]);

    try {
      const response = await fetch(`/api/admin/rescuers/${id}/approve`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        setApproved((current) => current.filter((value) => value !== id));
        setError(body?.error?.message ?? "We couldn't approve this rescuer. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setApproved((current) => current.filter((value) => value !== id));
      setError("Network error. Check your connection and try again.");
    }
  }

  if (rescuers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 bg-ink/[0.015] px-6 py-12 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-moss/10 text-moss">
          <Check className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-[0.9375rem] font-medium text-ink">Queue is clear</p>
        <p className="mt-1 max-w-[34ch] text-[0.8125rem] leading-[1.55] text-ink/55">
          New rescuer applications will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div>
      <FormAlert message={error} className="mb-3 mt-0" />

      <ul className="space-y-2.5">
        {rescuers.map((rescuer) => {
          const isApproved = approved.includes(rescuer.id);

          return (
            <li
              key={rescuer.id}
              className="rounded-xl border border-ink/[0.07] bg-ink/[0.012] p-3 transition-colors hover:border-ink/[0.12] hover:bg-ink/[0.02]"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[0.75rem] font-semibold uppercase tracking-wide text-ink/55"
                >
                  {initials(rescuer.fullName)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.875rem] font-semibold leading-tight text-ink">
                    {rescuer.fullName}
                  </p>
                  <p className="mt-1 truncate text-[0.75rem] leading-tight text-ink/50">
                    {rescuer.email}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-clay/10 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-clay">
                  Pending
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-2.5">
                <div className="min-w-0">
                  <p className="text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-ink/35">
                    Applied
                  </p>
                  <p className="mt-0.5 text-[0.75rem] leading-tight text-ink/60">
                    {formatApplied(rescuer.appliedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isApproved}
                  onClick={() => setConfirming(rescuer)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[0.75rem] font-medium transition-colors disabled:cursor-not-allowed ${
                    isApproved
                      ? "bg-moss/10 text-moss"
                      : "bg-ink text-paper hover:bg-moss disabled:opacity-70"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {isApproved ? "Approved" : "Approve"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(value) => {
          if (!value) setConfirming(null);
        }}
        tone="success"
        title="Approve this rescuer?"
        description={
          confirming ? (
            <>
              <span className="font-medium text-ink">{confirming.fullName}</span> will be
              granted rescuer access and can claim rescue assignments.
            </>
          ) : null
        }
        confirmLabel="Approve rescuer"
        onConfirm={() => {
          if (confirming) void approve(confirming.id);
        }}
      />
    </div>
  );
}
