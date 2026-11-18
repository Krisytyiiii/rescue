"use client";

import { Check, Minus } from "lucide-react";

import { evaluatePassword } from "@/lib/password";

const BAR_STYLES: Record<string, { fill: string; text: string }> = {
  weak: { fill: "bg-[#c0543f]", text: "text-[#c0543f]" },
  moderate: { fill: "bg-[#c2903f]", text: "text-[#a9782c]" },
  strong: { fill: "bg-moss", text: "text-moss" },
};

export function PasswordStrength({ password }: { password: string }) {
  const { level, label, criteria } = evaluatePassword(password);

  if (level === "empty") return null;

  const filled =
    level === "weak" ? 1 : level === "moderate" ? 2 : level === "strong" ? 4 : 3;
  const palette = BAR_STYLES[level];

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                index < filled ? palette.fill : "bg-ink/10"
              }`}
            />
          ))}
        </div>
        <span className={`text-[0.6875rem] font-semibold tracking-wide ${palette.text}`}>
          {label}
        </span>
      </div>

      <ul className="mt-2.5 grid gap-1 sm:grid-cols-2">
        {criteria.map((criterion) => (
          <li
            key={criterion.id}
            className={`flex items-center gap-1.5 text-[0.6875rem] leading-[1.5] transition-colors ${
              criterion.met ? "text-moss" : "text-ink/45"
            }`}
          >
            <span
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                criterion.met ? "bg-moss/10 text-moss" : "bg-ink/5 text-ink/35"
              }`}
            >
              {criterion.met ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <Minus className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
