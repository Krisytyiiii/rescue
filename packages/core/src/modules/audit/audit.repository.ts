import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { buildPageMeta, normalizePagination, type NormalizedPagination } from "../../shared/pagination.ts";
import type { Paginated } from "../../shared/types.ts";
import type {
  AuditFacets,
  AuditSummary,
  ListAuditQuery,
} from "./audit.types.ts";
import { AUDIT_DOMAIN_ACTIONS, AUDIT_SENSITIVE_ACTIONS } from "./audit.types.ts";

export const auditLogInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profilePhotoUrl: true,
      role: { select: { roleName: true } },
    },
  },
} satisfies Prisma.AuditLogInclude;

export type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: typeof auditLogInclude;
}>;

function rangeStart(range: ListAuditQuery["range"]): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
    case "7d":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

export function buildAuditWhere(query: ListAuditQuery): Prisma.AuditLogWhereInput {
  const start = rangeStart(query.range);
  const domainActions =
    query.domain && query.domain !== "all" ? AUDIT_DOMAIN_ACTIONS[query.domain] : null;
  const search = query.q?.trim();

  return {
    ...(start ? { createdAt: { gte: start } } : {}),
    ...(domainActions
      ? { action: query.action ? { equals: query.action, in: [...domainActions] } : { in: [...domainActions] } }
      : query.action
        ? { action: query.action }
        : {}),
    ...(query.actorId === "system"
      ? { userId: null }
      : query.actorId
        ? { userId: query.actorId }
        : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" as const } },
            { entityType: { contains: search, mode: "insensitive" as const } },
            {
              user: {
                is: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" as const } },
                    { lastName: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
}

export class AuditRepository {
  constructor(private readonly db: Db = prisma) {}

  async list(
    query: ListAuditQuery,
    pagination: NormalizedPagination,
  ): Promise<Paginated<AuditLogWithActor>> {
    const where = buildAuditWhere(query);
    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        include: auditLogInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { items, meta: buildPageMeta(total, pagination) };
  }

  async listForExport(query: ListAuditQuery, cap = 10_000): Promise<AuditLogWithActor[]> {
    return this.db.auditLog.findMany({
      where: buildAuditWhere(query),
      include: auditLogInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: cap,
    });
  }

  findById(id: string): Promise<AuditLogWithActor | null> {
    return this.db.auditLog.findFirst({ where: { id }, include: auditLogInclude });
  }

  async summary(query: ListAuditQuery): Promise<AuditSummary> {
    const where = buildAuditWhere(query);
    const [total, actors, sensitive, last] = await Promise.all([
      this.db.auditLog.count({ where }),
      this.db.auditLog.findMany({ where, distinct: ["userId"], select: { userId: true } }),
      this.db.auditLog.count({
        where: {
          AND: [
            where,
            { action: { in: [...AUDIT_SENSITIVE_ACTIONS] } },
          ],
        },
      }),
      this.db.auditLog.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      total,
      activeActors: actors.filter((row) => row.userId !== null).length,
      sensitive,
      lastActivity: last?.createdAt.toISOString() ?? null,
    };
  }

  async facets(query: ListAuditQuery): Promise<AuditFacets> {
    const where = buildAuditWhere(query);
    const [actionGroups, actorGroups] = await Promise.all([
      this.db.auditLog.groupBy({
        by: ["action"],
        where,
        _count: { _all: true },
        orderBy: { _count: { action: "desc" } },
        take: 100,
      }),
      this.db.auditLog.groupBy({
        by: ["userId"],
        where,
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 100,
      }),
    ]);

    const actorIds = actorGroups
      .map((group) => group.userId)
      .filter((id): id is string => Boolean(id));
    const users = actorIds.length
      ? await this.db.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      actions: actionGroups.map((group) => ({
        value: group.action,
        label: group.action.replaceAll("_", " "),
        count: group._count._all,
      })),
      actors: actorGroups.map((group) => {
        if (!group.userId) {
          return { value: "system", label: "System / unknown", count: group._count._all };
        }
        const user = userMap.get(group.userId);
        return {
          value: group.userId,
          label: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown user",
          count: group._count._all,
        };
      }),
    };
  }
}

export const auditRepository = new AuditRepository();
export { normalizePagination };
