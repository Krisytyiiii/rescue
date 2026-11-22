"use client";

import { ArrowRight, Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TermsDialog } from "@/components/terms-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { evaluatePassword } from "@/lib/password";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15";

interface SignupFormProps {
  email?: string;
  barangays: Array<{ id: number; name: string }>;
  notice?: string;
  error?: string;
}

export function SignupForm({
  email = "",
  barangays,
  notice,
  error,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(notice ?? "");
  const [formError, setFormError] = useState(error ?? "");

  const strength = evaluatePassword(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setMessage("");

    if (strength.level !== "strong") {
      setFormError("Choose a strong password that meets all five requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const phoneField = event.currentTarget.querySelector<HTMLInputElement>(
      'input[type="tel"]',
    );
    const phoneDigits = phoneField?.value.replace(/\D/g, "") ?? "";
    if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
      setFormError("Enter a complete 11-digit mobile number, or leave it blank.");
      return;
    }

    setPending(true);
    const data = new FormData(event.currentTarget);
    const barangay = String(data.get("barangayId") ?? "");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: String(data.get("firstName") ?? ""),
          lastName: String(data.get("lastName") ?? ""),
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
          phoneNumber: String(data.get("phoneNumber") ?? "") || undefined,
          barangayId: barangay ? Number(barangay) : undefined,
          role: String(data.get("role") ?? "community_user"),
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setFormError(
          body?.error?.message ??
            "We couldn't create your account. Please review your details and try again.",
        );
        return;
      }

      if (body?.data?.status === "verification_required") {
        const email = String(data.get("email") ?? "");
        window.location.assign(`/signup/verify?email=${encodeURIComponent(email)}`);
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
    <>
      <form onSubmit={handleSubmit} className="mt-7">
        <button
          type="button"
          onClick={() => window.location.assign("/api/auth/google/start?intent=signup")}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
            />
          </svg>
          Sign up with Google
        </button>

        <div className="my-4 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="label text-[0.5625rem] text-ink/40">or use email</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
                placeholder="Juan"
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
                placeholder="Dela Cruz"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label text-ink/55">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={email}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="label text-ink/55">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                aria-describedby="password-requirements"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 mt-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.7} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.7} />
                )}
              </button>
            </div>
            <div id="password-requirements">
              <PasswordStrength password={password} />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label text-ink/55">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={showMismatch}
                className={`${inputClass} pr-12 ${
                  confirmPassword
                    ? passwordsMatch
                      ? "border-moss/50 focus:border-moss focus:ring-moss/15"
                      : "border-[#c0543f]/50 focus:border-[#c0543f] focus:ring-[#c0543f]/15"
                    : ""
                }`}
              />
              <span className="absolute right-11 top-1/2 mt-1 flex -translate-y-1/2 items-center">
                {confirmPassword ? (
                  passwordsMatch ? (
                    <Check className="h-4 w-4 text-moss" strokeWidth={2.2} />
                  ) : (
                    <X className="h-4 w-4 text-[#c0543f]" strokeWidth={2.2} />
                  )
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 mt-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.7} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.7} />
                )}
              </button>
            </div>
            <p
              aria-live="polite"
              className={`mt-1.5 text-[0.6875rem] leading-[1.5] ${
                showMismatch ? "text-[#c0543f]" : "text-moss"
              } ${confirmPassword ? "" : "sr-only"}`}
            >
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <fieldset>
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
                <input
                  type="radio"
                  name="role"
                  value="rescuer"
                  className="h-4 w-4 accent-clay"
                />
                Rescuer / volunteer
              </label>
            </div>
          </fieldset>
        </div>

        <div className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-[1.5] text-ink/65">
          <input
            id="terms"
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink/25 accent-clay"
          />
          <span>
            <label htmlFor="terms" className="cursor-pointer">
              I agree to the volunteer code of conduct and adoption guidelines
            </label>{" "}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="link-line font-medium text-clay transition-colors hover:text-moss"
            >
              (read policy)
            </button>
            .
          </span>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          ) : (
            <>
              Create account
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.8}
              />
            </>
          )}
        </button>

        <FormAlert message={formError} />
        <FormAlert message={message} variant="info" />

        <p className="mt-5 border-t border-ink/10 pt-4 text-center text-[0.8125rem] text-ink/60">
          Already have an account?{" "}
          <Link
            href="/login"
            className="link-line font-medium text-ink transition-colors hover:text-clay"
          >
            Log in
          </Link>
        </p>
      </form>

      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}
