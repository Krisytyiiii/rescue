"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { FormAlert } from "@/components/ui/form-alert";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15";

interface CompleteProfileFormProps {
  email: string;
  firstName: string;
  lastName: string;
  barangays: Array<{ id: number; name: string }>;
}

export function CompleteProfileForm({
  email,
  firstName,
  lastName,
  barangays,
}: CompleteProfileFormProps) {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");

    const phoneField = event.currentTarget.querySelector<HTMLInputElement>(
      'input[type="tel"]',
    );
    const phoneDigits = phoneField?.value.replace(/\D/g, "") ?? "";
    if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
      setPending(false);
      setFormError("Enter a complete 11-digit mobile number, or leave it blank.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const barangay = String(data.get("barangayId") ?? "");

    try {
      const response = await fetch("/api/auth/google/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: String(data.get("firstName") ?? ""),
          middleName: String(data.get("middleName") ?? "") || undefined,
          lastName: String(data.get("lastName") ?? ""),
          phoneNumber: String(data.get("phoneNumber") ?? "") || undefined,
          barangayId: barangay ? Number(barangay) : undefined,
          role: String(data.get("role") ?? "community_user"),
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setFormError(
          body?.error?.message ??
            "We couldn't finish creating your account. Please review your details and try again.",
        );
        return;
      }

      if (body?.data?.status === "pending") {
        window.location.assign("/signup/pending");
        return;
      }

      window.location.assign("/");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div>
        <label htmlFor="email" className="label text-ink/55">
          Google email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className={`${inputClass} bg-ink/[0.03] text-ink/60`}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="label text-ink/55">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            defaultValue={firstName}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="label text-ink/55">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            defaultValue={lastName}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="middleName" className="label text-ink/55">
          Middle name <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="middleName"
          name="middleName"
          type="text"
          autoComplete="additional-name"
          className={inputClass}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phoneNumber" className="label text-ink/55">
            Mobile <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <PhoneInput id="phoneNumber" name="phoneNumber" />
        </div>
        <div>
          <label htmlFor="barangayId" className="label text-ink/55">
            Barangay <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <Select
            id="barangayId"
            name="barangayId"
            placeholder="Select barangay"
            options={barangays.map((barangay) => ({
              value: String(barangay.id),
              label: barangay.name,
            }))}
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="label text-ink/55">I am joining as</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-[0.8125rem] text-ink/70 transition-colors has-checked:border-clay has-checked:bg-clay/5 has-checked:text-ink">
            <input
              type="radio"
              name="role"
              value="community_user"
              defaultChecked
              className="h-4 w-4 accent-clay"
            />
            Resident
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-[0.8125rem] text-ink/70 transition-colors has-checked:border-clay has-checked:bg-clay/5 has-checked:text-ink">
            <input type="radio" name="role" value="rescuer" className="h-4 w-4 accent-clay" />
            Rescuer / volunteer
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <>
            Finish sign up
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </>
        )}
      </button>

      <FormAlert message={formError} />
    </form>
  );
}
