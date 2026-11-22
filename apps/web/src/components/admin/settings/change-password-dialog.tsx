"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useToast } from "@/components/ui/toast";

const INPUT =
  "h-9 w-full rounded-lg border border-ink/12 bg-white px-3 text-[0.8125rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay/50 focus:ring-2 focus:ring-clay/15";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 72) {
      setError("Your new password must be at most 72 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The confirmation does not match the new password.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a new password that differs from your current one.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          body?.error?.message ??
            "The password could not be changed. Check your current password and try again.",
        );
        setPending(false);
        return;
      }

      onClose();
      toast.success("Password updated", {
        description: "Use the new password the next time you sign in.",
      });
    } catch {
      setError("The password could not be changed. Please try again.");
      setPending(false);
    }
  }

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="change-password-title"
      closeLabel="Close change password"
      eyebrow="Account security"
      title="Change password"
      titleClassName="text-[0.9375rem] font-semibold text-ink"
      panelClassName="max-w-lg"
    >
      <form
        onSubmit={submit}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5"
      >
        <div className="flex items-start gap-2.5 rounded-lg bg-ink/[0.02] px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/45">
            <KeyRound className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <p className="text-[0.6875rem] leading-[1.55] text-ink/50">
            Enter your previous password, then choose a new one and retype it to confirm. You
            stay signed in on this device.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
            Previous password
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={INPUT}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
            New password
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className={INPUT}
          />
          <PasswordStrength password={newPassword} />
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
            Retype new password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className={INPUT}
          />
        </label>

        <FormAlert message={error} />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" size="md" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </OverlayCard>
  );
}
