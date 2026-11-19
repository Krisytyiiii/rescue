import { prisma } from "../../db/prisma.ts";
import { requireRole } from "../../shared/authz.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { normalizePagination } from "../../shared/pagination.ts";
import type { Actor } from "../../shared/types.ts";
import { AuditRepository, auditRepository, type AuditLogWithActor } from "./audit.repository.ts";
import type {
  AuditEntryRow,
  AuditFacets,
  AuditFieldChange,
  AuditListResult,
  AuditLogDetail,
  AuditRecordRef,
  AuditSummary,
  ListAuditQuery,
} from "./audit.types.ts";

const SENSITIVE_KEY = /password|secret|token|authorization|api[-_]?key|hash|salt/i;

function fullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

function maskIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}:…`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

interface RedactionResult {
  value: unknown;
  redacted: boolean;
}

/** Presentation-only redaction. Never writes back to the stored row. */
function redact(value: unknown): RedactionResult {
  let redacted = false;

  function walk(input: unknown, depth: number): unknown {
    if (depth > 8) return "[nested]";
    if (Array.isArray(input)) {
      return input.map((item) => walk(item, depth + 1));
    }
    if (input && typeof input === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(input as Record<string, unknown>)) {
        if (SENSITIVE_KEY.test(key)) {
          output[key] = "[redacted]";
          redacted = true;
        } else {
          output[key] = walk(child, depth + 1);
        }
      }
      return output;
    }
    return input;
  }

  return { value: walk(value, 0), redacted };
}

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.length > 160 ? `${value.slice(0, 157)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return "Object";
  return String(value);
}

function flatten(
  value: unknown,
  prefix: string,
  output: Map<string, unknown>,
  depth = 0,
): void {
  if (depth > 4) return;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output, depth + 1);
    }
    return;
  }
  if (prefix) output.set(prefix, value);
}

function label(path: string): string {
  const leaf = path.split(".").pop() ?? path;
  return leaf
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function diff(oldValue: unknown, newValue: unknown): AuditFieldChange[] {
  const before = new Map<string, unknown>();
  const after = new Map<string, unknown>();
  flatten(oldValue, "", before);
  flatten(newValue, "", after);

  const paths = new Set([...before.keys(), ...after.keys()]);
  const changes: AuditFieldChange[] = [];
  for (const path of paths) {
    const from = before.get(path);
    const to = after.get(path);
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes.push({
      path,
      label: label(path),
      before: displayValue(from),
      after: displayValue(to),
    });
  }
  return changes.slice(0, 30);
}

function summarize(changes: AuditFieldChange[], hasOld: boolean, hasNew: boolean): string {
  if (!hasOld && hasNew) return "Created";
  if (hasOld && !hasNew) return "Removed";
  if (changes.length === 0) return "Updated";
  const visible = changes.slice(0, 2).map((change) => {
    if (change.before === null) return `${change.label}: ${change.after}`;
    if (change.after === null) return `${change.label}: ${change.before} → none`;
    return `${change.label}: ${change.before} → ${change.after}`;
  });
  const extra = changes.length > 2 ? ` · +${changes.length - 2} more` : "";
  return `${visible.join(" · ")}${extra}`;
}

function toActor(entry: AuditLogWithActor): AuditEntryRow["actor"] {
  const user = entry.user;
  if (!user) return null;
  return {
    userId: user.id,
    fullName: fullName(user),
    email: user.email,
    profilePhotoUrl: user.profilePhotoUrl,
    role: user.role.roleName,
  };
}

function isRecordEntry(entry: AuditLogWithActor): entry is AuditLogWithActor & {
  entityType: string;
  entityId: string;
} {
  return Boolean(entry.entityType && entry.entityId);
}

export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  private assertAdmin(actor?: Actor): Actor {
    return requireRole(actor, "admin");
  }

  async list(query: ListAuditQuery, actor?: Actor): Promise<AuditListResult> {
    this.assertAdmin(actor);
    const pagination = normalizePagination({ page: query.page, pageSize: query.pageSize ?? 50 });

    const [page, summary, facets] = await Promise.all([
      this.repo.list(query, pagination),
      this.repo.summary(query),
      this.repo.facets(query),
    ]);

    const records = await this.resolveRecords(page.items);

    const items = page.items.map((entry) =>
      this.toRow(entry, records.get(`${entry.entityType}:${entry.entityId}`) ?? null),
    );

    return { items, meta: page.meta, summary, facets };
  }

  async get(id: string, actor?: Actor): Promise<AuditLogDetail> {
    this.assertAdmin(actor);
    const entry = await this.repo.findById(id);
    if (!entry) throw new NotFoundError("Audit entry");

    const records = await this.resolveRecords([entry]);
    const record = records.get(`${entry.entityType}:${entry.entityId}`) ?? null;
    const row = this.toRow(entry, record);

    const oldRedacted = redact(entry.oldValue);
    const newRedacted = redact(entry.newValue);
    const changes = diff(oldRedacted.value, newRedacted.value);

    return {
      ...row,
      oldValue: oldRedacted.value,
      newValue: newRedacted.value,
      changes,
      redacted: row.redacted || oldRedacted.redacted || newRedacted.redacted,
    };
  }

  async summary(query: ListAuditQuery, actor?: Actor): Promise<AuditSummary> {
    this.assertAdmin(actor);
    return this.repo.summary(query);
  }

  async facets(query: ListAuditQuery, actor?: Actor): Promise<AuditFacets> {
    this.assertAdmin(actor);
    return this.repo.facets(query);
  }

  async exportCsv(query: ListAuditQuery, actor?: Actor): Promise<string> {
    this.assertAdmin(actor);
    const entries = await this.repo.listForExport(query);
    const records = await this.resolveRecords(entries);
    const rows = entries.map((entry) =>
      this.toRow(entry, records.get(`${entry.entityType}:${entry.entityId}`) ?? null),
    );

    const header = ["Timestamp", "Actor", "Role", "Action", "Record type", "Record", "Change", "IP"];
    const lines = rows.map((row) =>
      [
        row.createdAt,
        row.actor?.fullName ?? "System",
        row.actor?.role ?? "",
        row.action,
        row.entityType ?? "",
        row.record?.code ?? row.record?.title ?? "",
        row.changeSummary,
        row.ipAddress ?? "",
      ]
        .map(csvCell)
        .join(","),
    );

    return [header.map(csvCell).join(","), ...lines].join("\r\n");
  }

  private toRow(entry: AuditLogWithActor, record: AuditRecordRef | null): AuditEntryRow {
    const oldRedacted = redact(entry.oldValue);
    const newRedacted = redact(entry.newValue);
    const changes = diff(oldRedacted.value, newRedacted.value);
    const hasOld = entry.oldValue !== null && entry.oldValue !== undefined;
    const hasNew = entry.newValue !== null && entry.newValue !== undefined;

    return {
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      createdAt: entry.createdAt.toISOString(),
      ipAddress: maskIp(entry.ipAddress),
      actor: toActor(entry),
      record,
      changeSummary: summarize(changes, hasOld, hasNew),
      redacted: oldRedacted.redacted || newRedacted.redacted,
    };
  }

  /** Batched human-code/title resolution for the rows on this page. */
  private async resolveRecords(
    entries: AuditLogWithActor[],
  ): Promise<Map<string, AuditRecordRef>> {
    const idsByType = new Map<string, Set<string>>();
    for (const entry of entries) {
      if (!isRecordEntry(entry)) continue;
      const bucket = idsByType.get(entry.entityType) ?? new Set<string>();
      bucket.add(entry.entityId);
      idsByType.set(entry.entityType, bucket);
    }

    const result = new Map<string, AuditRecordRef>();
    await Promise.all(
      [...idsByType.entries()].map(async ([type, ids]) => {
        const list = [...ids];
        const resolved = await this.resolveType(type, list);
        for (const [id, record] of resolved) result.set(`${type}:${id}`, record);
      }),
    );
    return result;
  }

  private async resolveType(type: string, ids: string[]): Promise<Map<string, AuditRecordRef>> {
    const map = new Map<string, AuditRecordRef>();

    switch (type) {
      case "report": {
        const rows = await prisma.report.findMany({
          where: { id: { in: ids } },
          select: { id: true, reportCode: true, reportType: true },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.reportCode,
            title: `Report · ${row.reportType.replaceAll("_", " ")}`,
          });
        }
        break;
      }
      case "animal": {
        const rows = await prisma.animal.findMany({
          where: { id: { in: ids } },
          select: { id: true, animalCode: true, name: true },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.animalCode,
            title: row.name ? `Animal · ${row.name}` : "Animal",
          });
        }
        break;
      }
      case "adoption_request": {
        const rows = await prisma.adoptionRequest.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            requestCode: true,
            animal: { select: { animalCode: true, name: true } },
          },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.requestCode,
            title: row.animal.name
              ? `Adoption · ${row.animal.name}`
              : `Adoption · ${row.animal.animalCode}`,
          });
        }
        break;
      }
      case "adoption_followup": {
        const rows = await prisma.adoptionFollowup.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            request: {
              select: {
                requestCode: true,
                animal: { select: { animalCode: true, name: true } },
              },
            },
          },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.request.requestCode,
            title: row.request.animal.name
              ? `Follow-up · ${row.request.animal.name}`
              : "Adoption follow-up",
          });
        }
        break;
      }
      case "rescue_operation": {
        const rows = await prisma.rescueOperation.findMany({
          where: { id: { in: ids } },
          select: { id: true, report: { select: { reportCode: true } } },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.report.reportCode,
            title: "Rescue operation",
          });
        }
        break;
      }
      case "health_record": {
        const rows = await prisma.healthRecord.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            recordType: true,
            animal: { select: { animalCode: true, name: true } },
          },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.animal.animalCode,
            title: `Health · ${row.recordType.replaceAll("_", " ")}`,
          });
        }
        break;
      }
      case "vaccination": {
        const rows = await prisma.vaccination.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            vaccineName: true,
            animal: { select: { animalCode: true } },
          },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.animal.animalCode,
            title: `Vaccination · ${row.vaccineName}`,
          });
        }
        break;
      }
      case "heart_rate_log": {
        const rows = await prisma.heartRateLog.findMany({
          where: { id: { in: ids } },
          select: { id: true, animal: { select: { animalCode: true } } },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: row.animal.animalCode,
            title: "Heart rate log",
          });
        }
        break;
      }
      case "conversation": {
        const rows = await prisma.conversation.findMany({
          where: { id: { in: ids } },
          select: { id: true, subject: true, status: true },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: null,
            title: row.subject ?? "Conversation",
          });
        }
        break;
      }
      case "message": {
        const rows = await prisma.message.findMany({
          where: { id: { in: ids } },
          select: { id: true, conversationId: true, conversation: { select: { subject: true } } },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.conversationId,
            code: null,
            title: row.conversation.subject ?? "Conversation message",
          });
        }
        break;
      }
      case "user": {
        const rows = await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        for (const row of rows) {
          map.set(row.id, {
            kind: type,
            id: row.id,
            linkId: row.id,
            code: null,
            title: fullName(row),
          });
        }
        break;
      }
      default:
        break;
    }

    return map;
  }
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const auditService = new AuditService();
