"use client";

import { Camera, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { OverlayCard } from "@/components/ui/overlay-card";
import { useToast } from "@/components/ui/toast";

import type { AdminProfileSummary } from "@furescue/core";

const INPUT =
  "h-9 w-full rounded-lg border border-ink/12 bg-white px-3 text-[0.8125rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-clay/50 focus:ring-2 focus:ring-clay/15";

interface ProfilePatch {
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
}

function initials(profile: AdminProfileSummary): string {
  return (
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || "A"
  );
}

export function ProfileEditDialog({
  profile,
  onClose,
  onSaved,
  onRevert,
}: {
  profile: AdminProfileSummary;
  onClose: () => void;
  onSaved: (next: ProfilePatch) => void;
  onRevert: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [middleName, setMiddleName] = useState(profile.middleName ?? "");
  const [lastName, setLastName] = useState(profile.lastName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile.profilePhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/profile/uploads", {
        method: "POST",
        body: form,
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok || !body.data?.url) {
        throw new Error(body?.error?.message ?? "Could not upload that photo.");
      }
      setPhotoUrl(body.data.url as string);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not upload that photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (phoneNumber && !/^\+639\d{9}$/.test(phoneNumber.trim())) {
      setError("Use the format +639XXXXXXXXX for the phone number.");
      return;
    }

    const payload: ProfilePatch = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || null,
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim() || null,
      profilePhotoUrl: photoUrl,
    };

    // Apply instantly and close; the request continues in the background.
    onSaved(payload);
    onClose();

    void (async () => {
      try {
        const response = await fetch("/api/admin/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: payload.firstName,
            middleName: payload.middleName ?? "",
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber ?? "",
            profilePhotoUrl: payload.profilePhotoUrl ?? "",
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          onRevert();
          toast.error("Profile not updated", {
            description:
              body?.error?.message ?? "Your previous details were restored. Please try again.",
          });
          return;
        }

        toast.success("Profile updated", {
          description: "Your administrator details are now up to date.",
        });
        router.refresh();
      } catch {
        onRevert();
        toast.error("Profile not updated", {
          description: "Your previous details were restored. Please try again.",
        });
      }
    })();
  }

  return (
    <OverlayCard
      onClose={onClose}
      labelledBy="edit-profile-title"
      closeLabel="Close edit profile"
      eyebrow="Account security"
      title="Edit profile"
      titleClassName="text-[0.9375rem] font-semibold text-ink"
      panelClassName="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-clay/10 text-[1rem] font-semibold text-clay ring-1 ring-inset ring-clay/15">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(profile)
            )}
          </span>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-2.5 text-[0.75rem] font-medium text-ink/65 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
              {uploading
                ? "Uploading…"
                : photoUrl
                  ? "Change photo"
                  : "Add photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadPhoto(file);
              }}
            />
            <p className="mt-1.5 text-[0.625rem] text-ink/40">
              JPG, PNG, or WebP up to 5 MB.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg bg-ink/[0.02] px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/45">
            <UserRound className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <p className="text-[0.6875rem] leading-[1.55] text-ink/50">
            Update your own name and contact number. Email and role stay managed from Users
            &amp; access.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
              First name
            </span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              required
              maxLength={60}
              className={INPUT}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
              Last name
            </span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              required
              maxLength={60}
              className={INPUT}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
            Middle name <span className="font-normal text-ink/35">(optional)</span>
          </span>
          <input
            value={middleName}
            onChange={(event) => setMiddleName(event.target.value)}
            autoComplete="additional-name"
            maxLength={60}
            className={INPUT}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6875rem] font-medium text-ink/60">
            Phone number <span className="font-normal text-ink/35">(optional)</span>
          </span>
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            autoComplete="tel"
            placeholder="+639XXXXXXXXX"
            inputMode="tel"
            className={INPUT}
          />
        </label>

        <FormAlert message={error} />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" size="md" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" disabled={uploading}>
            Save profile
          </Button>
        </div>
      </form>
    </OverlayCard>
  );
}
