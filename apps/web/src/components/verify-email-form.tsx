"use client";

import { useState } from "react";

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalized = code.replace(/\D/g, "");
    if (normalized.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: normalized }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? "We couldn't verify that code.");
        return;
      }

      if (body?.data?.status === "pending") {
        window.location.assign(`/signup/pending?email=${encodeURIComponent(email)}`);
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? "We couldn't send a new code.");
        return;
      }
      setNotice("A new code is on its way. Check your inbox.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7">
      <label htmlFor="verification-code" className="label text-ink/55">
        6-digit code
      </label>
      <input
        id="verification-code"
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className="mt-2 h-14 w-full rounded-xl border border-ink/15 bg-white text-center font-mono text-2xl tracking-[0.5em] text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-clay"
      />
      <p className="mt-2 text-[0.75rem] text-ink/50">Sent to {email}</p>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-[0.8125rem] text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 rounded-xl border border-clay/25 bg-clay/5 px-4 py-3 text-[0.8125rem] text-moss">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify email"}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || pending}
        className="mt-4 text-[0.8125rem] font-medium text-clay transition-opacity hover:opacity-70 disabled:opacity-50"
      >
        {resending ? "Sending a new code…" : "Resend code"}
      </button>
    </form>
  );
}
