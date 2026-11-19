import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  BadgeCheck,
  Ban,
  CalendarCheck,
  CheckCircle2,
  FilePlus2,
  FileWarning,
  HeartPulse,
  Lock,
  MessageSquare,
  PawPrint,
  Pencil,
  ShieldCheck,
  Siren,
  Stethoscope,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import type { AuditDomain, AuditRecordRef } from "@furescue/core";

export type AuditTone = "neutral" | "info" | "success" | "warning" | "danger";

interface ActionMeta {
  label: string;
  domain: Exclude<AuditDomain, "all">;
  tone: AuditTone;
  icon: LucideIcon;
}

export const AUDIT_ACTION_META: Record<string, ActionMeta> = {
  register: { label: "Account registered", domain: "accounts", tone: "info", icon: UserPlus },
  register_oauth: { label: "Account registered (OAuth)", domain: "accounts", tone: "info", icon: UserPlus },
  approve_rescuer: { label: "Rescuer approved", domain: "accounts", tone: "success", icon: UserCheck },
  update_user_status: { label: "Account status changed", domain: "accounts", tone: "warning", icon: Users },
  suspend_user: { label: "Account suspended", domain: "accounts", tone: "danger", icon: Ban },
  change_password: { label: "Password changed", domain: "accounts", tone: "warning", icon: Lock },
  update_profile: { label: "Profile updated", domain: "accounts", tone: "info", icon: Users },

  create_report: { label: "Report submitted", domain: "reports", tone: "info", icon: FilePlus2 },
  verify_report: { label: "Report verified", domain: "reports", tone: "success", icon: BadgeCheck },
  reject_report: { label: "Report rejected", domain: "reports", tone: "danger", icon: XCircle },
  assign_rescuer: { label: "Rescuer assigned", domain: "reports", tone: "info", icon: Users },
  update_report_status: { label: "Report status changed", domain: "reports", tone: "neutral", icon: FileWarning },

  cancel_rescue_assignment: { label: "Rescue assignment cancelled", domain: "rescues", tone: "danger", icon: Ban },
  fail_rescue_operation: { label: "Rescue operation failed", domain: "rescues", tone: "danger", icon: Siren },
  create_rescue_intake: { label: "Rescue intake recorded", domain: "rescues", tone: "success", icon: Siren },

  create_animal: { label: "Animal profile created", domain: "animals", tone: "success", icon: PawPrint },
  update_animal: { label: "Animal profile updated", domain: "animals", tone: "neutral", icon: Pencil },
  update_animal_lifecycle: { label: "Lifecycle status changed", domain: "animals", tone: "info", icon: Activity },
  moderate_animal_listing: { label: "Listing moderated", domain: "animals", tone: "info", icon: ShieldCheck },
  archive_animal: { label: "Animal archived", domain: "animals", tone: "neutral", icon: Archive },

  create_health_record: { label: "Health record added", domain: "health", tone: "success", icon: Stethoscope },
  update_health_record: { label: "Health record updated", domain: "health", tone: "neutral", icon: Pencil },
  create_vaccination: { label: "Vaccination recorded", domain: "health", tone: "success", icon: ShieldCheck },
  update_vaccination: { label: "Vaccination updated", domain: "health", tone: "neutral", icon: ShieldCheck },
  log_heart_rate: { label: "Heart rate logged", domain: "health", tone: "info", icon: HeartPulse },
  update_heart_rate: { label: "Heart rate updated", domain: "health", tone: "neutral", icon: HeartPulse },

  submit_adoption_request: { label: "Adoption application submitted", domain: "adoptions", tone: "info", icon: FilePlus2 },
  review_adoption_request: { label: "Adoption application reviewed", domain: "adoptions", tone: "info", icon: CalendarCheck },
  complete_adoption: { label: "Adoption completed", domain: "adoptions", tone: "success", icon: CheckCircle2 },
  withdraw_adoption_request: { label: "Adoption application withdrawn", domain: "adoptions", tone: "neutral", icon: Ban },
  record_adoption_followup: { label: "Adoption follow-up recorded", domain: "adoptions", tone: "info", icon: CalendarCheck },

  start_conversation: { label: "Conversation started", domain: "messaging", tone: "neutral", icon: MessageSquare },
  add_participant: { label: "Participant added", domain: "messaging", tone: "info", icon: UserPlus },
  remove_participant: { label: "Participant removed", domain: "messaging", tone: "info", icon: Users },
  delete_message: { label: "Message removed", domain: "messaging", tone: "danger", icon: Trash2 },
};

export function auditActionMeta(action: string): ActionMeta {
  return (
    AUDIT_ACTION_META[action] ?? {
      label: action.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      domain: "accounts",
      tone: "neutral",
      icon: Activity,
    }
  );
}

export const AUDIT_DOMAIN_OPTIONS: Array<{ id: AuditDomain; label: string }> = [
  { id: "all", label: "All" },
  { id: "accounts", label: "Accounts" },
  { id: "reports", label: "Reports" },
  { id: "rescues", label: "Rescues" },
  { id: "animals", label: "Animals" },
  { id: "health", label: "Health" },
  { id: "adoptions", label: "Adoptions" },
  { id: "messaging", label: "Messaging" },
];

export const ENTITY_LABELS: Record<string, string> = {
  report: "Report",
  rescue_operation: "Rescue",
  animal: "Animal",
  adoption_request: "Adoption",
  adoption_followup: "Follow-up",
  health_record: "Health record",
  vaccination: "Vaccination",
  heart_rate_log: "Heart rate",
  conversation: "Conversation",
  message: "Message",
  user: "Account",
};

export function entityLabel(type: string | null): string {
  if (!type) return "No linked record";
  return ENTITY_LABELS[type] ?? type.replaceAll("_", " ");
}

/** Deep link for a resolved record. Falls back to the record's own history. */
export function recordHref(record: AuditRecordRef): string {
  const id = record.linkId ?? record.id;
  const code = record.code ?? record.id;
  switch (record.kind) {
    case "report":
      return `/admin/reports?q=${encodeURIComponent(code)}`;
    case "rescue_operation":
      return `/admin/rescues?q=${encodeURIComponent(code)}`;
    case "animal":
      return `/admin/animals?q=${encodeURIComponent(code)}`;
    case "adoption_request":
    case "adoption_followup":
      return `/admin/adoptions?q=${encodeURIComponent(code)}`;
    case "health_record":
    case "vaccination":
    case "heart_rate_log":
      return `/admin/health?q=${encodeURIComponent(code)}`;
    case "conversation":
    case "message":
      return `/admin/messaging?conversation=${encodeURIComponent(id)}`;
    case "user":
      return `/admin/users?q=${encodeURIComponent(record.title)}`;
    default:
      return "#";
  }
}

export const TONE_CLASS: Record<AuditTone, { icon: string; wash: string }> = {
  neutral: { icon: "text-ink/45", wash: "bg-ink/[0.04]" },
  info: { icon: "text-[#2563eb]", wash: "bg-[#2563eb]/10" },
  success: { icon: "text-[#15803d]", wash: "bg-[#15803d]/10" },
  warning: { icon: "text-[#b45309]", wash: "bg-[#b45309]/10" },
  danger: { icon: "text-[#b42318]", wash: "bg-[#b42318]/10" },
};

/** Icons used by the page shell (kept here so the client bundle tree-shakes). */
export const AUDIT_TONE_BADGE: Record<AuditTone, "neutral" | "info" | "success" | "warning" | "danger"> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};
