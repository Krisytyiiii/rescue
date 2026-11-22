import { prisma } from "../../db/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  AssignmentStatus,
  ReportStatus,
} from "../../generated/prisma/enums.ts";
import { animalsService } from "../animals/animals.service.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { messagingService } from "../messaging/messaging.service.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireRole } from "../../shared/authz.ts";
import { BadRequestError, ConflictError, ForbiddenError } from "../../shared/errors.ts";
import type { Actor } from "../../shared/types.ts";
import { RescuesRepository, rescuesRepository } from "./rescues.repository.ts";
import type {
  OperationWithRelations,
  ReportMarkerWithRelations,
  UnassignedWithRelations,
} from "./rescues.repository.ts";
import type {
  ReportMarkerRow,
  ReportStatusCounts,
  RescueConsoleData,
  RescueFeedEntry,
  RescueOperationRow,
  RescuerAssignmentRow,
  RescuerHistoryPayload,
  RescuerHomePayload,
  RescuerQueuePayload,
  RescuerWorkloadRow,
  UnassignedReportRow,
} from "./rescues.types.ts";

/** Field actions a rescuer can take, mapped 1:1 to mobile transitions. */
export type RescuerFieldAction =
  | "accept"
  | "decline"
  | "start_en_route"
  | "mark_on_site"
  | "complete"
  | "fail";

export interface RescuerTransitionInput {
  reason?: string;
  outcomeNotes?: string;
  animalsRescued?: number;
}

const RESCUER_TRANSITION_FROM: Record<RescuerFieldAction, AssignmentStatus[]> = {
  accept: ["pending"],
  decline: ["pending"],
  start_en_route: ["accepted"],
  mark_on_site: ["en_route"],
  complete: ["on_site"],
  fail: ["pending", "accepted", "en_route", "on_site"],
};

function reporterName(
  reporter: { firstName: string; lastName: string } | null | undefined,
): string {
  return reporter ? `${reporter.firstName} ${reporter.lastName}` : "Anonymous";
}

function toOperationRow(operation: OperationWithRelations): RescueOperationRow {
  const report = operation.report;
  return {
    id: operation.id,
    reportId: report.id,
    reportCode: report.reportCode,
    reportType: report.reportType,
    reportStatus: report.status,
    species: report.species,
    urgencyLevel: report.urgencyLevel,
    description: report.description,
    barangay: report.barangay?.name ?? null,
    locationLandmark: report.locationLandmark,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    photoUrl: report.media[0]?.fileUrl ?? null,
    reporter: reporterName(report.reporter),
    rescuer: operation.rescuer
      ? {
          id: operation.rescuer.id,
          fullName: `${operation.rescuer.firstName} ${operation.rescuer.lastName}`,
        }
      : null,
    assignedBy: operation.assigner
      ? `${operation.assigner.firstName} ${operation.assigner.lastName}`
      : null,
    assignmentStatus: operation.assignmentStatus,
    assignedAt: operation.assignedAt.toISOString(),
    acceptedAt: operation.acceptedAt?.toISOString() ?? null,
    arrivedAt: operation.arrivedAt?.toISOString() ?? null,
    completedAt: operation.completedAt?.toISOString() ?? null,
    outcomeNotes: operation.outcomeNotes,
    animalsRescued: operation.animalsRescued,
    resultingAnimal: report.resultingAnimal
      ? { id: report.resultingAnimal.id, animalCode: report.resultingAnimal.animalCode }
      : null,
    statusHistory: report.statusHistory.map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      remarks: entry.remarks,
      changedAt: entry.changedAt.toISOString(),
      changedBy: entry.changer
        ? `${entry.changer.firstName} ${entry.changer.lastName}`
        : null,
    })),
  };
}

function toRescuerAssignment(
  operation: OperationWithRelations,
): import("./rescues.types.ts").RescuerAssignmentRow {
  const report = operation.report;
  const nextAction = (() => {
    switch (operation.assignmentStatus) {
      case "pending":
        return "accept" as const;
      case "accepted":
        return "start_en_route" as const;
      case "en_route":
        return "mark_on_site" as const;
      case "on_site":
        return "complete" as const;
      default:
        return null;
    }
  })();

  return {
    id: operation.id,
    reportId: report.id,
    reportCode: report.reportCode,
    status: operation.assignmentStatus,
    reportStatus: report.status,
    urgency: report.urgencyLevel,
    species: report.species,
    reportType: report.reportType,
    description: report.description,
    barangay: report.barangay?.name ?? null,
    landmark: report.locationLandmark,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    photoUrl: report.media[0]?.fileUrl ?? null,
    reporter: reporterName(report.reporter),
    reporterProfilePhotoUrl: report.reporter?.profilePhotoUrl ?? null,
    assignedBy: operation.assigner
      ? `${operation.assigner.firstName} ${operation.assigner.lastName}`
      : null,
    assignedByProfilePhotoUrl: operation.assigner?.profilePhotoUrl ?? null,
    reporterUserId: report.reporterUserId ?? null,
    assignedByUserId: operation.assignedBy ?? null,
    distanceKm: null,
    assignedAt: operation.assignedAt.toISOString(),
    completedAt: operation.completedAt?.toISOString() ?? null,
    nextAction,
  };
}

function toUnassignedRow(report: UnassignedWithRelations): UnassignedReportRow {
  return {
    reportId: report.id,
    reportCode: report.reportCode,
    reportType: report.reportType,
    species: report.species,
    urgencyLevel: report.urgencyLevel,
    description: report.description,
    barangay: report.barangay?.name ?? null,
    locationLandmark: report.locationLandmark,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    photoUrl: report.media[0]?.fileUrl ?? null,
    reporter: reporterName(report.reporter),
    submittedAt: report.submittedAt.toISOString(),
    verifiedAt: report.verifiedAt?.toISOString() ?? null,
  };
}

function toReportMarker(report: ReportMarkerWithRelations): ReportMarkerRow {
  const rescuer = report.rescueOperations[0]?.rescuer;
  return {
    reportId: report.id,
    reportCode: report.reportCode,
    reportStatus: report.status,
    reportType: report.reportType,
    species: report.species,
    urgencyLevel: report.urgencyLevel,
    description: report.description,
    barangay: report.barangay?.name ?? null,
    locationLandmark: report.locationLandmark,
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    photoUrl: report.media[0]?.fileUrl ?? null,
    reporter: reporterName(report.reporter),
    submittedAt: report.submittedAt.toISOString(),
    verifiedAt: report.verifiedAt?.toISOString() ?? null,
    rescuer: rescuer
      ? {
          id: rescuer.id,
          fullName: `${rescuer.firstName} ${rescuer.lastName}`,
          profilePhotoUrl: rescuer.profilePhotoUrl,
        }
      : null,
    assignmentStatus: report.rescueOperations[0]?.assignmentStatus ?? null,
    statusHistory: report.statusHistory.map((entry) => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      remarks: entry.remarks,
      changedAt: entry.changedAt.toISOString(),
      changedBy: entry.changer
        ? `${entry.changer.firstName} ${entry.changer.lastName}`
        : null,
    })),
  };
}

function buildFeed(operations: RescueOperationRow[]): RescueFeedEntry[] {
  const entries: RescueFeedEntry[] = [];

  for (const operation of operations) {
    const actor = operation.rescuer?.fullName ?? "System";
    const base = {
      reportId: operation.reportId,
      reportCode: operation.reportCode,
      actor,
    };

    const milestones: Array<{
      kind: RescueFeedEntry["kind"];
      at: string | null;
      actor?: string;
    }> = [
      { kind: "assigned", at: operation.assignedAt, actor: operation.assignedBy ?? "Admin" },
      { kind: "accepted", at: operation.acceptedAt },
      { kind: "arrived", at: operation.arrivedAt },
      { kind: "completed", at: operation.completedAt },
    ];

    if (operation.assignmentStatus === "failed") {
      milestones.push({ kind: "failed", at: operation.completedAt ?? operation.assignedAt });
    }
    if (operation.assignmentStatus === "declined") {
      milestones.push({ kind: "declined", at: operation.assignedAt });
    }

    for (const milestone of milestones) {
      if (!milestone.at) continue;
      entries.push({
        ...base,
        id: `${operation.id}:${milestone.kind}`,
        kind: milestone.kind,
        actor: milestone.actor ?? actor,
        at: milestone.at,
      });
    }
  }

  return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 16);
}

export class RescuesService {
  constructor(private readonly repo: RescuesRepository = rescuesRepository) {}

  /** Single read model for the command center panes. */
  /** Assignment offers still waiting on a rescuer response. */
  countPendingOffers(): Promise<number> {
    return prisma.rescueOperation.count({
      where: { assignmentStatus: "pending" },
    });
  }

  async console(): Promise<RescueConsoleData> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [
      reportsRaw,
      operationsRaw,
      unassignedRaw,
      grouped,
      workloadIds,
      rescuers,
      unassigned,
      completedToday,
    ] = await Promise.all([
      this.repo.listReports(),
      this.repo.listOperations(),
      this.repo.listUnassigned(),
      this.repo.groupStatuses(),
      this.repo.listOpenRescuerIds(),
      this.repo.listActiveRescuers(),
      this.repo.countUnassigned(),
      this.repo.countCompletedToday(since),
    ]);

    const reports = reportsRaw.map(toReportMarker);
    const reportCounts = {
      submitted: 0,
      verified: 0,
      assigned: 0,
      in_progress: 0,
      rescued: 0,
      unable_to_locate: 0,
      rejected: 0,
      closed: 0,
      total: reports.length,
    } as ReportStatusCounts;

    for (const report of reports) {
      reportCounts[report.reportStatus] += 1;
    }

    const operations = operationsRaw.map(toOperationRow);
    const unassignedRows = unassignedRaw.map(toUnassignedRow);

    const byStatus = Object.fromEntries(
      grouped.map((group) => [group.assignmentStatus, group._count._all]),
    ) as Record<string, number>;

    const riskCount = workloadIds.reduce((total, row) => total + row._count._all, 0);
    const countByRescuer = new Map(
      workloadIds.map((row) => [row.rescuerUserId, row._count._all]),
    );

    const workload: RescuerWorkloadRow[] = rescuers.map((rescuer) => ({
      id: rescuer.id,
      fullName: `${rescuer.firstName} ${rescuer.lastName}`,
      openCount: countByRescuer.get(rescuer.id) ?? 0,
    }));

    return {
      reports,
      reportCounts,
      operations,
      unassigned: unassignedRows,
      workload,
      counts: {
        unassigned,
        pending: byStatus.pending ?? 0,
        inField:
          (byStatus.accepted ?? 0) + (byStatus.en_route ?? 0) + (byStatus.on_site ?? 0),
        completed: byStatus.completed ?? 0,
        issues: (byStatus.declined ?? 0) + (byStatus.failed ?? 0),
        completedToday,
        total: riskCount + (byStatus.completed ?? 0) + (byStatus.declined ?? 0) + (byStatus.failed ?? 0),
      },
      feed: buildFeed(operations),
    };
  }

  /**
   * Every assignment the signed-in rescuer owns, newest first. The mobile
   * selectors derive Today's stats/sections and the history groups from this
   * single snapshot so the counts always reconcile with the operations table.
   */
  async rescuerHome(actor: Actor | undefined): Promise<RescuerHomePayload> {
    const rescuer = requireRole(actor, "rescuer");
    const [operations, unreadNotifications, unreadMessages, queueCount] =
      await Promise.all([
        this.repo.listMine(rescuer.userId),
        notificationsService.unreadCount(rescuer.userId),
        messagingService.unreadForUser(rescuer.userId),
        this.repo.countUnassigned(),
      ]);

    return {
      asOf: new Date().toISOString(),
      assignments: operations.map(toRescuerAssignment),
      unreadNotifications,
      unreadMessages,
      queueCount,
    };
  }

  /** Completed, failed and declined operations owned by the rescuer. */
  async rescuerHistory(actor: Actor | undefined): Promise<RescuerHistoryPayload> {
    const rescuer = requireRole(actor, "rescuer");
    const operations = await this.repo.listMineByStatus(rescuer.userId, [
      "completed",
      "failed",
      "declined",
    ]);
    return { assignments: operations.map(toRescuerAssignment) };
  }

  /**
   * Every geotagged report for the rescuer explore map. Uses the same read
   * model as the admin report map so the pins sit on the real coordinates.
   */
  async rescuerMap(actor: Actor | undefined): Promise<ReportMarkerRow[]> {
    requireRole(actor, "rescuer");
    const reports = await this.repo.listReports();
    return reports.map(toReportMarker);
  }

  /** Verified reports still waiting for an admin to dispatch them. */
  async rescuerQueue(actor: Actor | undefined): Promise<RescuerQueuePayload> {
    requireRole(actor, "rescuer");
    const reports = await this.repo.listUnassigned();
    return {
      reports: reports.map((report) => ({
        id: report.id,
        reportCode: report.reportCode,
        reportStatus: report.status,
        reportType: report.reportType,
        species: report.species,
        urgency: report.urgencyLevel,
        description: report.description,
        barangay: report.barangay?.name ?? null,
        landmark: report.locationLandmark,
        distanceKm: null,
        submittedAt: report.submittedAt.toISOString(),
        verifiedAt: report.verifiedAt?.toISOString() ?? null,
      })),
    };
  }

  /** One assignment, only if it belongs to the signed-in rescuer. */
  async rescuerAssignment(
    id: string,
    actor: Actor | undefined,
  ): Promise<RescuerAssignmentRow> {
    const rescuer = requireRole(actor, "rescuer");
    const operation = await this.repo.getOperation(id);
    if (operation.rescuerUserId !== rescuer.userId) {
      throw new ForbiddenError("This assignment belongs to another rescuer");
    }
    return toRescuerAssignment(operation);
  }

  /**
   * Field actions taken by the rescuer. Each action is guarded by the current
   * assignment status, mirrors the report status, and notifies the reporter or
   * dispatch team so the admin console updates from the same rows.
   */
  async rescuerTransition(
    id: string,
    action: RescuerFieldAction,
    actor: Actor | undefined,
    input: RescuerTransitionInput = {},
  ): Promise<RescuerAssignmentRow> {
    const rescuer = requireRole(actor, "rescuer");
    const operation = await this.repo.getOperation(id);

    if (operation.rescuerUserId !== rescuer.userId) {
      throw new ForbiddenError("This assignment belongs to another rescuer");
    }
    if (!RESCUER_TRANSITION_FROM[action].includes(operation.assignmentStatus)) {
      throw new ConflictError(
        `Cannot ${action} an assignment that is "${operation.assignmentStatus}"`,
      );
    }

    const now = new Date();
    const note = input.reason?.trim() || input.outcomeNotes?.trim() || null;
    const report = operation.report;

    await prisma.$transaction(async (tx) => {
      const operationUpdate: Prisma.RescueOperationUpdateInput = {};
      let reportStatus: ReportStatus | null = null;
      let title = "";
      let body = "";

      switch (action) {
        case "accept":
          operationUpdate.assignmentStatus = "accepted";
          operationUpdate.acceptedAt = now;
          reportStatus = "in_progress";
          title = "Rescuer accepted your report";
          body = `${report.reportCode}: help is on the way.`;
          break;
        case "decline":
          operationUpdate.assignmentStatus = "declined";
          operationUpdate.outcomeNotes = note ?? "Declined by rescuer";
          reportStatus = "verified";
          break;
        case "start_en_route":
          operationUpdate.assignmentStatus = "en_route";
          reportStatus = "in_progress";
          title = "Rescuer is en route";
          body = `${report.reportCode}: your rescuer is on the way.`;
          break;
        case "mark_on_site":
          operationUpdate.assignmentStatus = "on_site";
          operationUpdate.arrivedAt = now;
          title = "Rescuer arrived";
          body = `${report.reportCode}: your rescuer has arrived.`;
          break;
        case "complete":
          operationUpdate.assignmentStatus = "completed";
          operationUpdate.completedAt = now;
          operationUpdate.outcomeNotes = note;
          operationUpdate.animalsRescued = input.animalsRescued ?? null;
          reportStatus = "rescued";
          title = "Rescue completed";
          body = `${report.reportCode}: the animal has been rescued.`;
          break;
        case "fail":
          operationUpdate.assignmentStatus = "failed";
          operationUpdate.completedAt = now;
          operationUpdate.outcomeNotes = note ?? "Reported a problem in the field";
          reportStatus = "unable_to_locate";
          break;
      }

      await this.repo.updateOperation(id, operationUpdate, tx);

      if (reportStatus && reportStatus !== report.status) {
        await this.repo.updateReport(operation.reportId, { status: reportStatus }, tx);
        await this.repo.addReportHistory(
          {
            reportId: operation.reportId,
            oldStatus: report.status,
            newStatus: reportStatus,
            changedBy: rescuer.userId,
            remarks: note,
            changedAt: now,
          },
          tx,
        );
      }

      if (report.reporterUserId && title) {
        await notificationsService.notify(
          {
            recipientUserId: report.reporterUserId,
            notificationType: "rescue_assignment",
            title,
            body: body.slice(0, 255),
            referenceType: "report",
            referenceId: operation.reportId,
          },
          tx,
        );
      }

      if (action === "decline" || action === "fail") {
        await notificationsService.notifyAdmins(
          {
            notificationType: "rescue_assignment",
            title:
              action === "decline"
                ? "Rescuer declined an assignment"
                : "Field problem reported",
            body: `${report.reportCode}: ${note ?? "No reason provided"}`.slice(0, 255),
            referenceType: "report",
            referenceId: operation.reportId,
          },
          tx,
        );
      }

      await writeAuditLog(tx, {
        userId: rescuer.userId,
        action: `rescuer_${action}_assignment`,
        entityType: "rescue_operation",
        entityId: id,
        oldValue: { status: operation.assignmentStatus },
        newValue: { status: operationUpdate.assignmentStatus, reportStatus, note },
      });
    });

    return toRescuerAssignment(await this.repo.getOperation(id));
  }

  /** Cancel a dispatch. The report returns to the verified queue. */
  async cancel(id: string, actor: Actor | undefined, reason?: string): Promise<void> {
    const admin = requireRole(actor, "admin");
    const operation = await this.repo.getOperation(id);

    if (operation.assignmentStatus === "completed") {
      throw new ConflictError("Completed rescues cannot be cancelled");
    }

    const now = new Date();
    const note = reason?.trim() || "Assignment cancelled by admin";

    await prisma.$transaction(async (tx) => {
      await this.repo.updateOperation(
        id,
        { assignmentStatus: "declined", outcomeNotes: note },
        tx,
      );

      if (operation.report.status === "assigned") {
        await this.repo.updateReport(operation.reportId, { status: "verified" }, tx);
        await this.repo.addReportHistory(
          {
            reportId: operation.reportId,
            oldStatus: "assigned",
            newStatus: "verified",
            changedBy: admin.userId,
            remarks: note,
            changedAt: now,
          },
          tx,
        );
      }

      await notificationsService.notify(
        {
          recipientUserId: operation.rescuerUserId,
          notificationType: "rescue_assignment",
          title: "Assignment cancelled",
          body: `${operation.report.reportCode}: ${note}`,
          referenceType: "report",
          referenceId: operation.reportId,
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "cancel_rescue_assignment",
        entityType: "rescue_operation",
        entityId: id,
        oldValue: { status: operation.assignmentStatus },
        newValue: { status: "declined", reason: note },
      });
    });
  }

  /** Close an operation as failed and flag the report for review. */
  async markFailed(
    id: string,
    actor: Actor | undefined,
    reason: string,
  ): Promise<void> {
    const admin = requireRole(actor, "admin");
    const operation = await this.repo.getOperation(id);
    const note = reason.trim();

    if (!note) throw new BadRequestError("A failure reason is required");
    if (operation.assignmentStatus === "completed") {
      throw new ConflictError("Completed rescues cannot be marked as failed");
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await this.repo.updateOperation(
        id,
        { assignmentStatus: "failed", outcomeNotes: note, completedAt: now },
        tx,
      );

      const reportStatus = operation.report.status;
      if (reportStatus === "assigned" || reportStatus === "in_progress") {
        await this.repo.updateReport(
          operation.reportId,
          { status: "unable_to_locate" },
          tx,
        );
        await this.repo.addReportHistory(
          {
            reportId: operation.reportId,
            oldStatus: reportStatus,
            newStatus: "unable_to_locate",
            changedBy: admin.userId,
            remarks: note,
            changedAt: now,
          },
          tx,
        );
      }

      if (operation.report.reporterUserId) {
        await notificationsService.notify(
          {
            recipientUserId: operation.report.reporterUserId,
            notificationType: "rescue_assignment",
            title: "Rescue could not be completed",
            body: `${operation.report.reportCode}: ${note}`,
            referenceType: "report",
            referenceId: operation.reportId,
          },
          tx,
        );
      }

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "fail_rescue_operation",
        entityType: "rescue_operation",
        entityId: id,
        oldValue: { status: operation.assignmentStatus },
        newValue: { status: "failed", reason: note },
      });
    });
  }

  /** Create (once) the animal intake record for a completed rescue. */
  async createIntake(
    id: string,
    actor: Actor | undefined,
  ): Promise<{ id: string; animalCode: string }> {
    const admin = requireRole(actor, "admin");
    const operation = await this.repo.getOperation(id);

    if (operation.report.resultingAnimal) {
      return operation.report.resultingAnimal;
    }
    if (operation.assignmentStatus !== "completed") {
      throw new ConflictError("Only completed rescues can create an intake");
    }

    const report = await this.repo.findReport(operation.reportId);
    if (!report) throw new ConflictError("Report no longer exists");

    const animal = await animalsService.create(
      {
        species: report.species === "cat" ? "cat" : "dog",
        breedType: "mixed",
        sex: "unknown",
        originType: "rescue_report",
        sourceReportId: report.id,
        intakeDate: new Date(),
        description: report.description,
        ...(report.media.length
          ? {
              media: report.media.map((media, index) => ({
                mediaType: "photo" as const,
                fileUrl: media.fileUrl,
                sortOrder: index,
              })),
            }
          : {}),
      },
      { userId: admin.userId, role: admin.role, barangayId: admin.barangayId },
    );

    await prisma.$transaction(async (tx) => {
      await this.repo.addReportHistory(
        {
          reportId: report.id,
          oldStatus: report.status,
          newStatus: report.status,
          changedBy: admin.userId,
          remarks: `Intake created ${animal.animalCode}`,
          changedAt: new Date(),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "create_rescue_intake",
        entityType: "animal",
        entityId: animal.id,
        newValue: { animalCode: animal.animalCode, reportId: report.id },
      });

      if (report.reporterUserId) {
        await notificationsService.notify(
          {
            recipientUserId: report.reporterUserId,
            notificationType: "report_status",
            title: "Rescue complete — animal is safe",
            body: `${report.reportCode} was rescued and admitted as ${animal.animalCode}. Thank you for reporting.`,
            referenceType: "animal",
            referenceId: animal.id,
          },
          tx,
        );
      }
    });

    return { id: animal.id, animalCode: animal.animalCode };
  }
}

export const rescuesService = new RescuesService();
