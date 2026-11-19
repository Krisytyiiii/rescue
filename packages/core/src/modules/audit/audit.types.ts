import type { PageMeta } from "../../shared/types.ts";

export const AUDIT_RANGE_VALUES = ["today", "7d", "30d", "90d", "all"] as const;
export type AuditRange = (typeof AUDIT_RANGE_VALUES)[number];

export const AUDIT_DOMAIN_VALUES = [
  "all",
  "accounts",
  "reports",
  "rescues",
  "animals",
  "health",
  "adoptions",
  "messaging",
] as const;
export type AuditDomain = (typeof AUDIT_DOMAIN_VALUES)[number];

/** Action → domain map. Keep in sync with docs/ADMIN_AUDIT_PLAN.md. */
export const AUDIT_DOMAIN_ACTIONS: Record<Exclude<AuditDomain, "all">, readonly string[]> = {
  accounts: ["register", "register_oauth", "approve_rescuer", "update_user_status", "suspend_user", "change_password", "update_profile"],
  reports: ["create_report", "verify_report", "reject_report", "assign_rescuer", "update_report_status"],
  rescues: ["cancel_rescue_assignment", "fail_rescue_operation", "create_rescue_intake"],
  animals: [
    "create_animal",
    "update_animal",
    "update_animal_lifecycle",
    "moderate_animal_listing",
    "archive_animal",
  ],
  health: [
    "create_health_record",
    "update_health_record",
    "create_vaccination",
    "update_vaccination",
    "log_heart_rate",
    "update_heart_rate",
  ],
  adoptions: [
    "submit_adoption_request",
    "review_adoption_request",
    "complete_adoption",
    "withdraw_adoption_request",
    "record_adoption_followup",
  ],
  messaging: ["start_conversation", "add_participant", "remove_participant", "delete_message"],
};

/** Actions that deserve a second look in the summary strip. */
export const AUDIT_SENSITIVE_ACTIONS = [
  "reject_report",
  "fail_rescue_operation",
  "cancel_rescue_assignment",
  "archive_animal",
  "suspend_user",
  "deactivate_user",
  "delete_message",
  "withdraw_adoption_request",
] as const;

export interface ListAuditQuery {
  range?: AuditRange;
  domain?: AuditDomain;
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditActorRow {
  userId: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  role: string;
}

export type AuditRecordKind =
  | "report"
  | "rescue_operation"
  | "animal"
  | "adoption_request"
  | "adoption_followup"
  | "health_record"
  | "vaccination"
  | "heart_rate_log"
  | "conversation"
  | "message"
  | "user"
  | string;

export interface AuditRecordRef {
  kind: AuditRecordKind;
  id: string;
  /** id used for deep links when it differs from the audited entity id. */
  linkId: string | null;
  code: string | null;
  title: string;
}

export interface AuditFieldChange {
  path: string;
  label: string;
  before: string | null;
  after: string | null;
}

export interface AuditEntryRow {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  actor: AuditActorRow | null;
  record: AuditRecordRef | null;
  changeSummary: string;
  redacted: boolean;
}

export interface AuditLogDetail extends AuditEntryRow {
  oldValue: unknown;
  newValue: unknown;
  changes: AuditFieldChange[];
}

export interface AuditSummary {
  total: number;
  activeActors: number;
  sensitive: number;
  lastActivity: string | null;
}

export interface AuditFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface AuditFacets {
  actors: AuditFacetOption[];
  actions: AuditFacetOption[];
}

export interface AuditListResult {
  items: AuditEntryRow[];
  meta: PageMeta;
  summary: AuditSummary;
  facets: AuditFacets;
}
