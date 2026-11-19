import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireActor, requireRole } from "../../shared/authz.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { Actor } from "../../shared/types.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { HealthRepository, healthRepository } from "./health.repository.ts";
import {
  HEART_RATE_RANGES,
  VACCINATION_DUE_WINDOW_DAYS,
  type CreateHealthRecordInput,
  type CreateHeartRateInput,
  type CreateVaccinationInput,
  type UpdateHealthRecordInput,
  type UpdateHeartRateInput,
  type UpdateVaccinationInput,
} from "./health.types.ts";

function vaccinationStatus(
  nextDueDate: Date | null | undefined,
  now = new Date(),
): "completed" | "due" | "overdue" {
  if (!nextDueDate) return "completed";
  if (nextDueDate.getTime() < now.getTime()) return "overdue";
  const horizon = new Date(now.getTime() + VACCINATION_DUE_WINDOW_DAYS * 86_400_000);
  return nextDueDate.getTime() <= horizon.getTime() ? "due" : "completed";
}

export class HealthService {
  constructor(private readonly repo: HealthRepository = healthRepository) {}

  private async requireAnimal(animalId: string) {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, deletedAt: null },
      select: { id: true, animalCode: true, name: true, species: true },
    });
    if (!animal) throw new NotFoundError("Animal");
    return animal;
  }

  async addRecord(input: CreateHealthRecordInput, actor?: Actor) {
    const staff = requireRole(actor, "admin", "rescuer");
    await this.requireAnimal(input.animalId);

    return prisma.$transaction(async (tx) => {
      const record = await this.repo.createRecord(
        {
          animalId: input.animalId,
          recordType: input.recordType,
          recordDate: input.recordDate,
          diagnosis: input.diagnosis,
          treatment: input.treatment,
          medication: input.medication,
          weightKg: input.weightKg,
          followUpDate: input.followUpDate,
          remarks: input.remarks,
          attendedBy: staff.userId,
        },
        tx,
      );

      if (input.weightKg !== undefined) {
        await tx.animal.update({ where: { id: input.animalId }, data: { weightKg: input.weightKg } });
      }

      await writeAuditLog(tx, {
        userId: staff.userId,
        action: "create_health_record",
        entityType: "health_record",
        entityId: record.id,
        newValue: { animalId: input.animalId, recordType: input.recordType },
      });

      return record;
    });
  }

  async addVaccination(input: CreateVaccinationInput, actor?: Actor) {
    const staff = requireRole(actor, "admin", "rescuer");
    const animal = await this.requireAnimal(input.animalId);
    const status = vaccinationStatus(input.nextDueDate);

    const vaccination = await this.repo.createVaccination({
      animalId: input.animalId,
      vaccineName: input.vaccineName,
      doseNumber: input.doseNumber,
      dateGiven: input.dateGiven,
      nextDueDate: input.nextDueDate,
      batchLotNo: input.batchLotNo,
      administeredBy: staff.userId,
      status,
    });

    await writeAuditLog(prisma, {
      userId: staff.userId,
      action: "create_vaccination",
      entityType: "vaccination",
      entityId: vaccination.id,
      newValue: { animalCode: animal.animalCode, vaccine: input.vaccineName, status },
    });

    if (status === "due" || status === "overdue") {
      await notificationsService.notifyAdmins({
        notificationType: "vaccination_due",
        title: `Vaccination ${status}`,
        body: `${animal.animalCode}${animal.name ? ` (${animal.name})` : ""}: ${input.vaccineName} is ${status}.`,
        referenceType: "vaccination",
        referenceId: vaccination.id,
      });
    }

    return vaccination;
  }

  async logHeartRate(input: CreateHeartRateInput, actor?: Actor) {
    const staff = requireRole(actor, "admin", "rescuer");
    const animal = await this.requireAnimal(input.animalId);
    const range = HEART_RATE_RANGES[animal.species];
    const isFlagged = input.heartRateBpm < range.min || input.heartRateBpm > range.max;
    const measuredAt = input.measuredAt ?? new Date();

    const log = await this.repo.createHeartRate({
      animalId: input.animalId,
      healthRecordId: input.healthRecordId,
      heartRateBpm: input.heartRateBpm,
      measurementContext: input.measurementContext,
      measuredAt,
      recordedBy: staff.userId,
      isFlagged,
      notes: input.notes,
    });

    await writeAuditLog(prisma, {
      userId: staff.userId,
      action: "log_heart_rate",
      entityType: "heart_rate_log",
      entityId: log.id,
      newValue: { animalId: input.animalId, bpm: input.heartRateBpm, isFlagged },
    });

    if (isFlagged) {
      await notificationsService.notifyAdmins({
        notificationType: "system",
        title: "Abnormal heart rate recorded",
        body: `${animal.animalCode}: ${input.heartRateBpm} bpm (expected ${range.min}–${range.max}).`,
        referenceType: "heart_rate_log",
        referenceId: log.id,
      });
    }

    return log;
  }

  async updateRecord(
    animalId: string,
    recordId: string,
    input: UpdateHealthRecordInput,
    actor?: Actor,
  ) {
    const staff = requireRole(actor, "admin", "rescuer");
    await this.requireAnimal(animalId);

    const existing = await prisma.healthRecord.findFirst({
      where: { id: recordId, animalId },
    });
    if (!existing) throw new NotFoundError("Health record");

    return prisma.$transaction(async (tx) => {
      const record = await tx.healthRecord.update({
        where: { id: recordId },
        data: {
          recordType: input.recordType,
          recordDate: input.recordDate,
          diagnosis: input.diagnosis,
          treatment: input.treatment,
          medication: input.medication,
          weightKg: input.weightKg,
          followUpDate: input.followUpDate,
          remarks: input.remarks,
        },
      });

      if (input.weightKg !== undefined) {
        await tx.animal.update({
          where: { id: animalId },
          data: { weightKg: input.weightKg },
        });
      }

      await writeAuditLog(tx, {
        userId: staff.userId,
        action: "update_health_record",
        entityType: "health_record",
        entityId: recordId,
        oldValue: { animalId, recordType: existing.recordType },
        newValue: { animalId, recordType: input.recordType },
      });

      return record;
    });
  }

  async updateVaccination(
    animalId: string,
    vaccinationId: string,
    input: UpdateVaccinationInput,
    actor?: Actor,
  ) {
    const staff = requireRole(actor, "admin", "rescuer");
    await this.requireAnimal(animalId);

    const existing = await prisma.vaccination.findFirst({
      where: { id: vaccinationId, animalId },
    });
    if (!existing) throw new NotFoundError("Vaccination");

    const status = vaccinationStatus(input.nextDueDate);
    const vaccination = await prisma.vaccination.update({
      where: { id: vaccinationId },
      data: {
        vaccineName: input.vaccineName,
        doseNumber: input.doseNumber,
        dateGiven: input.dateGiven,
        nextDueDate: input.nextDueDate,
        batchLotNo: input.batchLotNo,
        status,
      },
    });

    await writeAuditLog(prisma, {
      userId: staff.userId,
      action: "update_vaccination",
      entityType: "vaccination",
      entityId: vaccinationId,
      oldValue: { animalId, vaccineName: existing.vaccineName },
      newValue: { animalId, vaccineName: input.vaccineName, status },
    });

    return vaccination;
  }

  async updateHeartRate(
    animalId: string,
    heartRateId: string,
    input: UpdateHeartRateInput,
    actor?: Actor,
  ) {
    const staff = requireRole(actor, "admin", "rescuer");
    const animal = await this.requireAnimal(animalId);

    const existing = await prisma.heartRateLog.findFirst({
      where: { id: heartRateId, animalId },
    });
    if (!existing) throw new NotFoundError("Heart rate reading");

    const range = HEART_RATE_RANGES[animal.species];
    const isFlagged = input.heartRateBpm < range.min || input.heartRateBpm > range.max;
    const log = await prisma.heartRateLog.update({
      where: { id: heartRateId },
      data: {
        heartRateBpm: input.heartRateBpm,
        measurementContext: input.measurementContext,
        measuredAt: input.measuredAt ?? existing.measuredAt,
        notes: input.notes,
        isFlagged,
      },
    });

    await writeAuditLog(prisma, {
      userId: staff.userId,
      action: "update_heart_rate",
      entityType: "heart_rate_log",
      entityId: heartRateId,
      oldValue: { animalId, bpm: existing.heartRateBpm },
      newValue: { animalId, bpm: input.heartRateBpm, isFlagged },
    });

    return log;
  }

  /** Cross-animal lists for the admin health console. */
  async listAllRecords(actor?: Actor) {
    requireRole(actor, "admin", "rescuer");
    return this.repo.listAllRecords();
  }

  async listAllVaccinations(actor?: Actor) {
    requireRole(actor, "admin", "rescuer");
    return this.repo.listAllVaccinations();
  }

  async listAllHeartRates(actor?: Actor) {
    requireRole(actor, "admin", "rescuer");
    return this.repo.listAllHeartRates();
  }

  async getAnimalHealth(animalId: string) {
    await this.requireAnimal(animalId);
    const [records, vaccinations, heartRates] = await Promise.all([
      this.repo.listRecords(animalId),
      this.repo.listVaccinations(animalId),
      this.repo.listHeartRates(animalId),
    ]);
    return { records, vaccinations, heartRates };
  }

  /**
   * Scheduled job: recompute reminder statuses and raise one admin alert per
   * due/overdue vaccination. Safe to run repeatedly.
   */
  async refreshVaccinationReminders(now = new Date()) {
    const horizon = new Date(now.getTime() + VACCINATION_DUE_WINDOW_DAYS * 86_400_000);
    const due = await this.repo.dueVaccinations(horizon);

    let updated = 0;
    for (const vaccination of due) {
      const status = vaccinationStatus(vaccination.nextDueDate, now);
      if (vaccination.status !== status) {
        await this.repo.updateVaccinationStatus(vaccination.id, status);
        updated += 1;
      }
      if (status !== "completed") {
        await notificationsService.notifyAdmins({
          notificationType: "vaccination_due",
          title: `Vaccination ${status}`,
          body: `${vaccination.animal.animalCode}: ${vaccination.vaccineName} is ${status}.`,
          referenceType: "vaccination",
          referenceId: vaccination.id,
        });
      }
    }

    return { scanned: due.length, updated };
  }
}

export const healthService = new HealthService();
