import type { AccountStatus, RoleName } from "../../generated/prisma/enums.ts";

export type ProbeState = "ok" | "warn" | "off";

export interface AdminProfileSummary {
  id: string;
  fullName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: RoleName;
  accountStatus: AccountStatus;
  barangay: string | null;
  profilePhotoUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface EnvironmentSummary {
  appName: string;
  nodeEnv: string;
  appUrl: string;
  timezone: string;
}

export interface ServiceProbe {
  state: ProbeState;
  label: string;
  detail: string;
  latencyMs?: number | null;
}

export interface AuditProbe extends ServiceProbe {
  lastAt: string | null;
  last24h: number;
}

export interface IntegrationRow {
  label: string;
  value: string;
  state: ProbeState;
  hint: string;
}

export interface SettingsOverview {
  admin: AdminProfileSummary;
  environment: EnvironmentSummary;
  status: {
    database: ServiceProbe;
    storage: ServiceProbe;
    realtime: ServiceProbe;
    audit: AuditProbe;
  };
  integrations: IntegrationRow[];
  generatedAt: string;
}
