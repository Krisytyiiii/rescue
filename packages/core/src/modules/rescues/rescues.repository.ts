import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";

const operationInclude = {
  report: {
    include: {
      barangay: { select: { name: true } },
      media: {
        where: { mediaType: "photo" },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      reporter: { select: { firstName: true, lastName: true } },
      resultingAnimal: { select: { id: true, animalCode: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 6,
        include: { changer: { select: { firstName: true, lastName: true } } },
      },
    },
  },
  rescuer: { select: { id: true, firstName: true, lastName: true } },
  assigner: { select: { firstName: true, lastName: true } },
} satisfies Prisma.RescueOperationInclude;

export type OperationWithRelations = Prisma.RescueOperationGetPayload<{
  include: typeof operationInclude;
}>;

const unassignedInclude = {
  barangay: { select: { name: true } },
  media: {
    where: { mediaType: "photo" },
    orderBy: { createdAt: "asc" },
    take: 1,
  },
  reporter: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ReportInclude;

export type UnassignedWithRelations = Prisma.ReportGetPayload<{
  include: typeof unassignedInclude;
}>;

const reportMarkerInclude = {
  barangay: { select: { name: true } },
  media: {
    where: { mediaType: "photo" },
    orderBy: { createdAt: "asc" },
    take: 1,
  },
  reporter: { select: { firstName: true, lastName: true } },
  rescueOperations: {
    orderBy: { assignedAt: "desc" },
    take: 1,
    select: {
      assignmentStatus: true,
      rescuer: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  statusHistory: {
    orderBy: { changedAt: "desc" },
    take: 5,
    include: { changer: { select: { firstName: true, lastName: true } } },
  },
} satisfies Prisma.ReportInclude;

export type ReportMarkerWithRelations = Prisma.ReportGetPayload<{
  include: typeof reportMarkerInclude;
}>;

export class RescuesRepository {
  constructor(private readonly db: Db = prisma) {}

  listOperations(limit = 300): Promise<OperationWithRelations[]> {
    return this.db.rescueOperation.findMany({
      where: { report: { deletedAt: null } },
      include: operationInclude,
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  /** Every operation assigned to one rescuer (active and past). */
  listMine(rescuerUserId: string, limit = 200): Promise<OperationWithRelations[]> {
    return this.db.rescueOperation.findMany({
      where: { rescuerUserId, report: { deletedAt: null } },
      include: operationInclude,
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  /** Operations assigned to one rescuer filtered by assignment status. */
  listMineByStatus(
    rescuerUserId: string,
    statuses: Array<"pending" | "accepted" | "declined" | "en_route" | "on_site" | "completed" | "failed">,
    limit = 200,
  ): Promise<OperationWithRelations[]> {
    return this.db.rescueOperation.findMany({
      where: {
        rescuerUserId,
        assignmentStatus: { in: statuses },
        report: { deletedAt: null },
      },
      include: operationInclude,
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  listReports(limit = 500): Promise<ReportMarkerWithRelations[]> {
    return this.db.report.findMany({
      where: { deletedAt: null },
      include: reportMarkerInclude,
      orderBy: { submittedAt: "desc" },
      take: limit,
    });
  }

  listUnassigned(limit = 100): Promise<UnassignedWithRelations[]> {
    return this.db.report.findMany({
      where: {
        deletedAt: null,
        status: "verified",
        duplicateOfReportId: null,
        rescueOperations: { none: {} },
      },
      include: unassignedInclude,
      orderBy: [{ verifiedAt: "asc" }, { submittedAt: "asc" }],
      take: limit,
    });
  }

  countUnassigned() {
    return this.db.report.count({
      where: {
        deletedAt: null,
        status: "verified",
        duplicateOfReportId: null,
        rescueOperations: { none: {} },
      },
    });
  }

  groupStatuses() {
    return this.db.rescueOperation.groupBy({
      by: ["assignmentStatus"],
      where: { report: { deletedAt: null } },
      _count: { _all: true },
    });
  }

  countCompletedToday(since: Date) {
    return this.db.rescueOperation.count({
      where: { completedAt: { gte: since }, report: { deletedAt: null } },
    });
  }

  listOpenRescuerIds() {
    return this.db.rescueOperation.groupBy({
      by: ["rescuerUserId"],
      where: {
        assignmentStatus: { in: ["pending", "accepted", "en_route", "on_site"] },
        report: { deletedAt: null },
      },
      _count: { _all: true },
    });
  }

  listActiveRescuers() {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        role: { roleName: "rescuer" },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    });
  }

  async getOperation(id: string): Promise<OperationWithRelations> {
    const operation = await this.db.rescueOperation.findFirst({
      where: { id, report: { deletedAt: null } },
      include: operationInclude,
    });
    if (!operation) throw new NotFoundError("Rescue operation");
    return operation;
  }

  updateOperation(
    id: string,
    data: Prisma.RescueOperationUpdateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.rescueOperation.update({ where: { id }, data });
  }

  updateReport(
    id: string,
    data: Prisma.ReportUpdateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.report.update({ where: { id }, data });
  }

  addReportHistory(
    data: Prisma.ReportStatusHistoryUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.reportStatusHistory.create({ data });
  }

  findReport(id: string) {
    return this.db.report.findFirst({
      where: { id, deletedAt: null },
      include: {
        barangay: { select: { name: true } },
        media: {
          where: { mediaType: "photo" },
          orderBy: { createdAt: "asc" },
          take: 4,
        },
        resultingAnimal: { select: { id: true, animalCode: true } },
      },
    });
  }
}

export const rescuesRepository = new RescuesRepository();
