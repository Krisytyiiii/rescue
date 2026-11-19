import { prisma } from "../../db/prisma.ts";
import { animalsService } from "../animals/animals.service.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireRole } from "../../shared/authz.ts";
import { BadRequestError, ConflictError } from "../../shared/errors.ts";
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
  RescuerWorkloadRow,
  UnassignedReportRow,
} from "./rescues.types.ts";

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
      ? { id: rescuer.id, fullName: `${rescuer.firstName} ${rescuer.lastName}` }
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
    });

    return { id: animal.id, animalCode: animal.animalCode };
  }
}

export const rescuesService = new RescuesService();
