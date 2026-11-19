import type { Prisma } from "../../generated/prisma/client.ts";
import type { ReportStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireActor, requireRole } from "../../shared/authz.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import { normalizePagination } from "../../shared/pagination.ts";
import type { Actor } from "../../shared/types.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { ReportsRepository, reportsRepository } from "./reports.repository.ts";
import {
  REPORT_STATUS_TRANSITIONS,
  type AssignRescuerInput,
  type CreateReportInput,
  type ListReportsQuery,
  type ReportDetail,
  type UpdateReportStatusInput,
} from "./reports.types.ts";

function assertTransition(from: ReportStatus, to: ReportStatus): void {
  if (!REPORT_STATUS_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Cannot move a report from "${from}" to "${to}"`);
  }
}

const TERMINAL_STATUSES: readonly ReportStatus[] = ["rejected", "closed"];

export class ReportsService {
  constructor(private readonly repo: ReportsRepository = reportsRepository) {}

  async create(input: CreateReportInput, actor?: Actor): Promise<ReportDetail> {
    // Objectives 2 & 3: flag suspected duplicates within 50 m / 24 h.
    const nearby = await this.repo.findNearby(input.latitude, input.longitude, 50, 24);
    const duplicateOf = nearby[0];

    const report = await prisma.$transaction(async (tx) => {
      const reportCode = await this.repo.nextReportCode(tx);

      const created = await this.repo.create(
        {
          reportCode,
          reporterUserId: actor?.userId ?? null,
          reportType: input.reportType,
          species: input.species,
          description: input.description,
          urgencyLevel: input.urgencyLevel,
          animalCount: input.animalCount ?? 1,
          latitude: input.latitude,
          longitude: input.longitude,
          barangayId: input.barangayId ?? actor?.barangayId ?? null,
          locationLandmark: input.locationLandmark,
          status: "submitted",
          submittedAt: input.submittedAt ?? new Date(),
          syncedAt: new Date(),
          duplicateOfReportId: duplicateOf?.id ?? null,
          ...(input.media?.length
            ? {
                media: {
                  create: input.media.map((item) => ({
                    mediaType: item.mediaType,
                    fileUrl: item.fileUrl,
                    fileSizeKb: item.fileSizeKb,
                  })),
                },
              }
            : {}),
        },
        tx,
      );

      await this.repo.addStatusHistory(
        {
          reportId: created.id,
          newStatus: "submitted",
          changedBy: actor?.userId ?? null,
          remarks: duplicateOf ? `Possible duplicate of ${duplicateOf.reportCode}` : "Report submitted",
          changedAt: created.submittedAt,
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: actor?.userId ?? null,
        action: "create_report",
        entityType: "report",
        entityId: created.id,
        newValue: {
          reportCode: created.reportCode,
          status: created.status,
          urgencyLevel: created.urgencyLevel,
          duplicateOf: duplicateOf?.reportCode ?? null,
        },
      });

      await notificationsService.notifyAdmins(
        {
          notificationType: "report_status",
          title: `New ${created.urgencyLevel} report`,
          body: `${created.reportCode} · ${created.barangay?.name ?? "Unknown barangay"} · ${
            created.reporter
              ? `${created.reporter.firstName} ${created.reporter.lastName}`
              : "Anonymous"
          }: ${created.description}`.slice(0, 255),
          referenceType: "report",
          referenceId: created.id,
        },
        tx,
      );

      return created;
    });

    return report;
  }

  async list(query: ListReportsQuery) {
    const pagination = normalizePagination(query);
    return this.repo.list(query, pagination);
  }

  async getById(id: string): Promise<ReportDetail> {
    return this.repo.getById(id);
  }

  async verify(id: string, actor: Actor | undefined, remarks?: string): Promise<ReportDetail> {
    const admin = requireRole(actor, "admin");
    const current = await this.repo.getById(id);
    assertTransition(current.status, "verified");

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.updateStatus(
        id,
        {
          status: "verified",
          verifier: { connect: { id: admin.userId } },
          verifiedAt: new Date(),
        },
        tx,
      );

      await this.repo.addStatusHistory(
        {
          reportId: id,
          oldStatus: current.status,
          newStatus: "verified",
          changedBy: admin.userId,
          remarks: remarks ?? "Report verified",
          changedAt: new Date(),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "verify_report",
        entityType: "report",
        entityId: id,
        oldValue: { status: current.status },
        newValue: { status: "verified" },
      });

      await this.notifyReporter(tx, updated, "Report verified", "Your report has been verified.");
      return updated;
    });
  }

  async reject(id: string, actor: Actor | undefined, reason: string): Promise<ReportDetail> {
    const admin = requireRole(actor, "admin");
    const current = await this.repo.getById(id);
    assertTransition(current.status, "rejected");

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.updateStatus(
        id,
        { status: "rejected", rejectionReason: reason },
        tx,
      );

      await this.repo.addStatusHistory(
        {
          reportId: id,
          oldStatus: current.status,
          newStatus: "rejected",
          changedBy: admin.userId,
          remarks: reason,
          changedAt: new Date(),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "reject_report",
        entityType: "report",
        entityId: id,
        oldValue: { status: current.status },
        newValue: { status: "rejected", reason },
      });

      await this.notifyReporter(tx, updated, "Report rejected", reason);
      return updated;
    });
  }

  async assignRescuer(
    id: string,
    input: AssignRescuerInput,
    actor: Actor | undefined,
  ): Promise<ReportDetail> {
    const admin = requireRole(actor, "admin");
    const current = await this.repo.getById(id);

    if (current.status !== "verified" && current.status !== "assigned") {
      throw new ConflictError("Only verified reports can be assigned");
    }

    const rescuer = await this.repo.findActiveRescuer(input.rescuerUserId);
    if (!rescuer) throw new NotFoundError("Active rescuer");

    return prisma.$transaction(async (tx) => {
      await this.repo.createRescueOperation(
        {
          reportId: id,
          rescuerUserId: rescuer.id,
          assignedBy: admin.userId,
          assignmentStatus: "pending",
          assignedAt: new Date(),
        },
        tx,
      );

      const updated = await this.repo.updateStatus(id, { status: "assigned" }, tx);

      await this.repo.addStatusHistory(
        {
          reportId: id,
          oldStatus: current.status,
          newStatus: "assigned",
          changedBy: admin.userId,
          remarks: `Assigned to ${rescuer.firstName} ${rescuer.lastName}`,
          changedAt: new Date(),
        },
        tx,
      );

      const rescuerName = `${rescuer.firstName} ${rescuer.lastName}`;
      await notificationsService.notify(
        {
          recipientUserId: rescuer.id,
          notificationType: "rescue_assignment",
          title: "New rescue assignment",
          body: `${updated.reportCode} · ${updated.barangay?.name ?? "Unknown barangay"}: ${updated.description}`.slice(
            0,
            255,
          ),
          referenceType: "report",
          referenceId: id,
        },
        tx,
      );

      if (updated.reporterUserId) {
        await notificationsService.notify(
          {
            recipientUserId: updated.reporterUserId,
            notificationType: "report_status",
            title: "Rescuer assigned to your report",
            body: `${updated.reportCode}: ${rescuerName} will handle your case.`,
            referenceType: "report",
            referenceId: id,
          },
          tx,
        );
      }

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "assign_rescuer",
        entityType: "report",
        entityId: id,
        newValue: { rescuerUserId: rescuer.id, notes: input.notes ?? null },
      });

      return updated;
    });
  }

  async updateStatus(
    id: string,
    input: UpdateReportStatusInput,
    actor: Actor | undefined,
  ): Promise<ReportDetail> {
    const staff = requireRole(actor, "admin", "rescuer");
    if (input.status === "rejected" && staff.role !== "admin") {
      throw new ForbiddenError("Only administrators can reject a report");
    }
    if (input.status === "verified" || input.status === "assigned") {
      throw new BadRequestError("Use the verify or assign endpoints for this transition");
    }

    const current = await this.repo.getById(id);
    assertTransition(current.status, input.status);

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.updateStatus(
        id,
        {
          status: input.status,
          ...(input.status === "rejected" && input.rejectionReason
            ? { rejectionReason: input.rejectionReason }
            : {}),
        },
        tx,
      );

      await this.repo.addStatusHistory(
        {
          reportId: id,
          oldStatus: current.status,
          newStatus: input.status,
          changedBy: staff.userId,
          remarks: input.remarks,
          changedAt: new Date(),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: staff.userId,
        action: "update_report_status",
        entityType: "report",
        entityId: id,
        oldValue: { status: current.status },
        newValue: { status: input.status, remarks: input.remarks ?? null },
      });

      await this.notifyReporter(
        tx,
        updated,
        `Report ${input.status.replaceAll("_", " ")}`,
        input.remarks ?? `Your report is now ${input.status.replaceAll("_", " ")}.`,
      );

      return updated;
    });
  }

  /** Dashboard counters for the admin home screen. */
  async getCounts() {
    const [open, inProgress, rescued, rejected] = await prisma.$transaction([
      prisma.report.count({ where: { status: { in: ["submitted", "verified", "assigned"] }, deletedAt: null } }),
      prisma.report.count({ where: { status: "in_progress", deletedAt: null } }),
      prisma.report.count({ where: { status: "rescued", deletedAt: null } }),
      prisma.report.count({ where: { status: "rejected", deletedAt: null } }),
    ]);
    return { open, inProgress, rescued, rejected };
  }

  private async notifyReporter(
    tx: Prisma.TransactionClient,
    report: ReportDetail,
    title: string,
    body: string,
  ): Promise<void> {
    if (!report.reporterUserId) return;
    await notificationsService.notify(
      {
        recipientUserId: report.reporterUserId,
        notificationType: "report_status",
        title,
        body: body.slice(0, 255),
        referenceType: "report",
        referenceId: report.id,
      },
      tx,
    );
  }
}

export const reportsService = new ReportsService();
