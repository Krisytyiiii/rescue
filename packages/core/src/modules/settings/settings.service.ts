import { env } from "../../config/env.ts";
import { prisma } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { requireRole } from "../../shared/authz.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import type { Actor } from "../../shared/types.ts";
import { authService } from "../auth/auth.service.ts";
import type { UpdateProfileInput } from "./settings.schema.ts";
import type {
  AdminProfileSummary,
  AuditProbe,
  IntegrationRow,
  ProbeState,
  ServiceProbe,
  SettingsOverview,
} from "./settings.types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Keeps a hostname recognizable without revealing credentials or full hosts. */
function maskHost(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const hostname = new URL(raw).hostname;
    const [head = "", ...rest] = hostname.split(".");
    if (rest.length <= 1) return "****";
    return `${head.slice(0, 2)}****.${rest.join(".")}`;
  } catch {
    return null;
  }
}

function supabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

function probe(
  configured: boolean,
  readyLabel: string,
  missingLabel: string,
  detail: string,
): ServiceProbe {
  return {
    state: configured ? "ok" : "off",
    label: configured ? readyLabel : missingLabel,
    detail,
  };
}

export class SettingsService {
  /** Phase 1 overview: read-only probes and environment metadata. */
  async overview(actor?: Actor): Promise<SettingsOverview> {
    requireRole(actor, "admin");

    const [database, admin, lastAudit, audit24h] = await Promise.all([
      this.probeDatabase(),
      prisma.user.findFirst({
        where: { id: actor?.userId, deletedAt: null },
        include: {
          role: { select: { roleName: true } },
          barangay: { select: { name: true } },
        },
      }),
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      }),
    ]);

    if (!admin) throw new NotFoundError("Account");

    const storageConfigured = supabaseConfigured() && Boolean(env.SUPABASE_STORAGE_BUCKET);
    const realtimeConfigured = supabaseConfigured();

    const audit: AuditProbe = {
      state: lastAudit ? "ok" : "warn",
      label: lastAudit ? "Recording" : "No events yet",
      detail: lastAudit
        ? `${audit24h} event${audit24h === 1 ? "" : "s"} in the last 24 hours`
        : "New administrative actions will appear here",
      lastAt: lastAudit?.createdAt.toISOString() ?? null,
      last24h: audit24h,
    };

    return {
      admin: this.toAdmin(admin),
      environment: {
        appName: env.APP_NAME,
        nodeEnv: env.NODE_ENV,
        appUrl: env.APP_URL,
        timezone: "Asia/Manila",
      },
      status: {
        database,
        storage: probe(
          storageConfigured,
          "Configured",
          "Not configured",
          storageConfigured
            ? `Bucket: ${env.SUPABASE_STORAGE_BUCKET}`
            : "Supabase URL and key are required for remote storage",
        ),
        realtime: probe(
          realtimeConfigured,
          "Enabled",
          "Off",
          realtimeConfigured
            ? "Broadcast channel is available to the admin console"
            : "Live updates stay off until Supabase is configured",
        ),
        audit,
      },
      integrations: this.integrationRows(storageConfigured, realtimeConfigured),
      generatedAt: new Date().toISOString(),
    };
  }

  async changePassword(
    actor: Actor | undefined,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const current = requireRole(actor, "admin");
    await authService.changePassword(current.userId, currentPassword, newPassword);
  }

  /** Self-service profile edit. Email and role stay managed by Users & access. */
  async updateProfile(actor: Actor | undefined, input: UpdateProfileInput): Promise<void> {
    const current = requireRole(actor, "admin");

    const before = await prisma.user.findFirst({
      where: { id: current.userId, deletedAt: null },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        phoneNumber: true,
      },
    });
    if (!before) throw new NotFoundError("Account");

    const next = {
      firstName: input.firstName,
      middleName: input.middleName?.trim() ? input.middleName.trim() : null,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber?.trim() ? input.phoneNumber.trim() : null,
    };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: current.userId }, data: next });
      await writeAuditLog(tx, {
        userId: current.userId,
        action: "update_profile",
        entityType: "user",
        entityId: current.userId,
        oldValue: before,
        newValue: next,
      });
    });
  }

  private async probeDatabase(): Promise<ServiceProbe> {
    const started = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - started;
      return {
        state: "ok",
        label: "Connected",
        detail: `${latency} ms round trip`,
        latencyMs: latency,
      };
    } catch {
      return {
        state: "off",
        label: "Unreachable",
        detail: "The database did not answer the health check",
        latencyMs: null,
      };
    }
  }

  private integrationRows(storageConfigured: boolean, realtimeConfigured: boolean): IntegrationRow[] {
    const supabaseHost = maskHost(env.NEXT_PUBLIC_SUPABASE_URL);
    const databaseHost = maskHost(env.DATABASE_URL);
    const hasAnon = Boolean(
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    const hasServiceRole = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

    const state = (ready: boolean): ProbeState => (ready ? "ok" : "warn");

    return [
      {
        label: "Supabase project",
        value: supabaseHost ?? "Not configured",
        state: state(Boolean(supabaseHost)),
        hint: supabaseHost
          ? "Project host used for storage and realtime broadcast"
          : "Set NEXT_PUBLIC_SUPABASE_URL to enable storage and realtime",
      },
      {
        label: "Supabase anon key",
        value: hasAnon ? "Configured" : "Missing",
        state: state(hasAnon),
        hint: "Browser-safe key; the value is never displayed",
      },
      {
        label: "Service role key",
        value: hasServiceRole ? "Configured" : "Missing",
        state: state(hasServiceRole),
        hint: "Server-only key used for privileged jobs and broadcasts",
      },
      {
        label: "Storage bucket",
        value: storageConfigured ? env.SUPABASE_STORAGE_BUCKET : "Not configured",
        state: state(storageConfigured),
        hint: "Bucket that receives uploaded media",
      },
      {
        label: "Realtime broadcasts",
        value: realtimeConfigured ? "Enabled" : "Off",
        state: state(realtimeConfigured),
        hint: "Powers live audit, messaging, and notification refresh",
      },
      {
        label: "Database host",
        value: databaseHost ?? "Configured",
        state: state(Boolean(env.DATABASE_URL)),
        hint: "Host only; credentials and the connection string stay hidden",
      },
      {
        label: "Session lifetime",
        value: env.JWT_EXPIRES_IN,
        state: "ok",
        hint: "Signed-in admins re-authenticate when the token expires",
      },
      {
        label: "Map tiles",
        value: "OpenStreetMap",
        state: "ok",
        hint: "Used by the rescue operations map",
      },
    ];
  }

  private toAdmin(admin: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    accountStatus: AdminProfileSummary["accountStatus"];
    lastLoginAt: Date | null;
    createdAt: Date;
    role: { roleName: AdminProfileSummary["role"] };
    barangay: { name: string } | null;
  }): AdminProfileSummary {
    return {
      id: admin.id,
      fullName: [admin.firstName, admin.middleName, admin.lastName]
        .filter(Boolean)
        .join(" "),
      firstName: admin.firstName,
      middleName: admin.middleName,
      lastName: admin.lastName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      role: admin.role.roleName,
      accountStatus: admin.accountStatus,
      barangay: admin.barangay?.name ?? null,
      lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
      createdAt: admin.createdAt.toISOString(),
    };
  }
}

export const settingsService = new SettingsService();
