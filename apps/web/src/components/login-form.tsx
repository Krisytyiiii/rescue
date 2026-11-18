"use client";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FormAlert } from "@/components/ui/form-alert";

interface LoginFormProps {
  email?: string;
  error?: string;
  notice?: string;
}

export function LoginForm({ email = "", error, notice }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(notice ?? "");
  const [formError, setFormError] = useState(error ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError("");
    setMessage("");

    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
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
            "We couldn't sign you in. Please check your email and password and try again.",
        );
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
      <button
        type="button"
        onClick={() => window.location.assign("/api/auth/google/start?intent=login")}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white text-[0.9375rem] font-medium text-ink transition-colors hover:border-ink/30 hover:bg-ink/[0.02]"
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
        Sign in with Google
      </button>

      <div className="my-5 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="label text-[0.5625rem] text-ink/40">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="space-y-4">
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
            className="mt-2 h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label text-ink/55">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[0.75rem] font-medium text-clay transition-colors hover:text-moss"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
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

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 text-[0.8125rem] text-ink/65">
        <input
          type="checkbox"
          name="remember"
          className="h-4 w-4 rounded border-ink/25 accent-clay"
        />
        Keep me signed in
      </label>

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
      <FormAlert message={message} variant="info" />

      <p className="mt-6 border-t border-ink/10 pt-5 text-center text-[0.8125rem] text-ink/60">
        New to FuRescue?{" "}
        <Link
          href="/signup"
          className="link-line font-medium text-ink transition-colors hover:text-clay"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
