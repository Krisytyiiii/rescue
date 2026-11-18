"use client";

import { useState } from "react";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-ink/15 bg-white px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-clay focus:ring-4 focus:ring-clay/15";

interface PhoneInputProps {
  name: string;
  id?: string;
  defaultValue?: string;
  className?: string;
}

/** Keep at most 11 national digits, normalising +63 / 63 / 9… prefixes to 09…. */
function toNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("63")) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("9") && digits.length <= 10) digits = `0${digits}`;

  return digits.slice(0, 11);
}

/** 09171234567 → 917 123 4567 (the +63 prefix is rendered separately). */
function formatNational(digits: string): string {
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  if (local.length <= 3) return local;
  if (local.length <= 6) return `${local.slice(0, 3)} ${local.slice(3)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** 09171234567 → +639171234567 (what the API stores). */
function toE164(digits: string): string {
  return digits.length === 11 && digits.startsWith("09")
    ? `+63${digits.slice(1)}`
    : "";
}

export function PhoneInput({ name, id, defaultValue = "", className = "" }: PhoneInputProps) {
  const [digits, setDigits] = useState(() => toNationalDigits(defaultValue));
  const e164 = toE164(digits);
  const incomplete = digits.length > 0 && digits.length < 11;

  return (
    <div>
      <input type="hidden" name={name} value={e164} />

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 mt-1 -translate-y-1/2 text-[0.9375rem] text-ink/45"
        >
          +63
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatNational(digits)}
          onChange={(event) => setDigits(toNationalDigits(event.target.value))}
          placeholder="917 123 4567"
          maxLength={12}
          aria-invalid={incomplete}
          aria-describedby={incomplete ? `${id ?? name}-hint` : undefined}
          className={`${inputClass} pl-14 ${
            incomplete ? "border-[#c0543f]/50 focus:border-[#c0543f] focus:ring-[#c0543f]/15" : ""
          } ${className}`}
        />
      </div>

      <p
        id={`${id ?? name}-hint`}
        className={`mt-1.5 text-[0.6875rem] leading-[1.5] ${
          incomplete ? "text-[#c0543f]" : "text-ink/40"
        }`}
      >
        {incomplete
          ? "Enter a complete 11-digit mobile number."
          : "Philippine mobile number, digits only."}
      </p>
    </div>
  );
}
