export type PasswordCriterionId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "symbol";

export interface PasswordCriterion {
  id: PasswordCriterionId;
  label: string;
  met: boolean;
}

export type PasswordLevel = "empty" | "weak" | "moderate" | "strong";

export interface PasswordStrength {
  score: number;
  level: PasswordLevel;
  label: string;
  criteria: PasswordCriterion[];
}

const DEFINITIONS: Array<{
  id: PasswordCriterionId;
  label: string;
  test: (value: string) => boolean;
}> = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "uppercase", label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { id: "lowercase", label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number (0–9)", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "One symbol (!@#$…)", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

/** Ordering used by the UI: empty → weak → moderate → strong. */
export function evaluatePassword(password: string): PasswordStrength {
  const criteria = DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    met: definition.test(password),
  }));
  const score = criteria.filter((criterion) => criterion.met).length;

  if (!password) {
    return { score: 0, level: "empty", label: "", criteria };
  }
  if (score <= 2) {
    return { score, level: "weak", label: "Weak", criteria };
  }
  if (score <= 4) {
    return { score, level: "moderate", label: "Moderate", criteria };
  }
  return { score, level: "strong", label: "Strong", criteria };
}
