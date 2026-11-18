"use client";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FormAlert } from "@/components/ui/form-alert";

interface AdminLoginFormProps {
  error?: string;
}

export function AdminLoginForm({ error }: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(error ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");

    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setFormError(
          body?.error?.message ??
            "We couldn't sign you in. Please check your credentials and try again.",
        );
        return;
      }

      window.location.assign("/admin");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="label text-ink/55">
            Administrator email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="admin@furescue.ph"
            className="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
          />
        </div>

        <div>
          <label htmlFor="password" className="label text-ink/55">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••••"
              className="h-12 w-full rounded-xl border border-ink/15 bg-white px-4 pr-12 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.7} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.7} />
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[0.9375rem] font-medium text-paper transition-colors hover:bg-moss disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <>
            Log in
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </>
        )}
      </button>

      <FormAlert message={formError} />

      <p className="mt-6 border-t border-ink/10 pt-5 text-center text-[0.8125rem] text-ink/60">
        Not an administrator?{" "}
        <Link
          href="/login"
          className="link-line font-medium text-ink transition-colors hover:text-clay"
        >
          Use the regular login
        </Link>
      </p>
    </form>
  );
}
