import type { Role } from "./auth";

export type PasswordCriterion = {
  id: "length" | "uppercase" | "lowercase" | "number" | "symbol";
  label: string;
  met: boolean;
};

export type PasswordLevel = "empty" | "weak" | "moderate" | "strong";

export interface PasswordStrength {
  score: number;
  level: PasswordLevel;
  criteria: PasswordCriterion[];
}

const PASSWORD_DEFINITIONS: Array<{
  id: PasswordCriterion["id"];
  label: string;
  test: (value: string) => boolean;
}> = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number (0–9)", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "One symbol (!@#$…)", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

/** Mirrors apps/web/src/lib/password.ts so both clients agree on strength. */
export function evaluatePassword(password: string): PasswordStrength {
  const criteria = PASSWORD_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    met: definition.test(password),
  }));
  const score = criteria.filter((criterion) => criterion.met).length;

  if (!password) return { score: 0, level: "empty", criteria };
  if (score <= 2) return { score, level: "weak", criteria };
  if (score <= 4) return { score, level: "moderate", criteria };
  return { score, level: "strong", criteria };
}

/** Accepts 09XXXXXXXXX, 9XXXXXXXXX, or +639XXXXXXXXX and returns E.164. */
export function normalizePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `+63${digits}`;
  return `+${digits}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  if (!value.trim()) return true;
  const normalized = normalizePhone(value);
  return Boolean(normalized && /^\+639\d{9}$/.test(normalized));
}

export interface LoginDraft {
  email: string;
  password: string;
}

export function validateLogin(draft: LoginDraft): string | null {
  if (!draft.email.trim() || !draft.password) {
    return "Enter your email and password to continue.";
  }
  if (!isValidEmail(draft.email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export interface SignupDraft {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  barangayId?: number;
  role: Role;
  terms: boolean;
}

export interface GoogleSignupDraft {
  firstName: string;
  lastName: string;
  phone: string;
  terms: boolean;
}

export const SIGNUP_STEPS = 3;

/** Google already verified the email, so only profile fields need checking. */
export function validateGoogleSignup(draft: GoogleSignupDraft): string | null {
  if (!draft.firstName.trim() || !draft.lastName.trim()) {
    return "Enter your first and last name.";
  }
  if (!isValidPhone(draft.phone)) {
    return "Enter a complete mobile number, like 0917 123 4567.";
  }
  if (!draft.terms) {
    return "Please agree to the volunteer code of conduct and adoption guidelines.";
  }
  return null;
}

/** Pure validation for one step of the signup flow. */
export function validateSignupStep(step: number, draft: SignupDraft): string | null {
  if (step === 0) {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      return "Enter your first and last name.";
    }
    if (!isValidEmail(draft.email)) {
      return "Enter a valid email address.";
    }
    return null;
  }

  if (step === 1) {
    if (evaluatePassword(draft.password).level !== "strong") {
      return "Choose a strong password that meets all five requirements.";
    }
    if (draft.password !== draft.confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  if (!isValidPhone(draft.phone)) {
    return "Enter a complete mobile number, like 0917 123 4567.";
  }
  if (!draft.terms) {
    return "Please agree to the volunteer code of conduct and adoption guidelines.";
  }
  return null;
}
