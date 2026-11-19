import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import type {
  CreateHealthRecordInput,
  CreateVaccinationInput,
} from "./health.types.ts";
import {
  healthRecordListInclude,
  heartRateListInclude,
  vaccinationListInclude,
} from "./health.types.ts";

export class HealthRepository {
  constructor(private readonly db: Db = prisma) {}

  createRecord(
    data: Prisma.HealthRecordUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.healthRecord.create({ data });
  }

  createVaccination(
    data: Prisma.VaccinationUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.vaccination.create({ data });
  }

  createHeartRate(
    data: Prisma.HeartRateLogUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.heartRateLog.create({ data });
  }

  listRecords(animalId: string) {
    return this.db.healthRecord.findMany({
      where: { animalId },
      orderBy: { recordDate: "desc" },
    });
  }

  listVaccinations(animalId: string) {
    return this.db.vaccination.findMany({
      where: { animalId },
      orderBy: { dateGiven: "desc" },
    });
  }

  listHeartRates(animalId: string, take = 50) {
    return this.db.heartRateLog.findMany({
      where: { animalId },
      orderBy: { measuredAt: "desc" },
      take,
    });
  }

  dueVaccinations(horizon: Date) {
    return this.db.vaccination.findMany({
      where: { nextDueDate: { lte: horizon } },
      include: {
        animal: { select: { id: true, animalCode: true, name: true, species: true } },
      },
      orderBy: { nextDueDate: "asc" },
    });
  }

  updateVaccinationStatus(id: string, status: "completed" | "due" | "overdue") {
    return this.db.vaccination.update({ where: { id }, data: { status } });
  }

  /** Cross-animal lists used by /admin/health. Deleted animals are excluded. */
  listAllRecords() {
    return this.db.healthRecord.findMany({
      where: { animal: { deletedAt: null } },
      include: healthRecordListInclude,
      orderBy: { recordDate: "desc" },
    });
  }

  listAllVaccinations() {
    return this.db.vaccination.findMany({
      where: { animal: { deletedAt: null } },
      include: vaccinationListInclude,
      orderBy: { dateGiven: "desc" },
    });
  }

  listAllHeartRates(take = 500) {
    return this.db.heartRateLog.findMany({
      where: { animal: { deletedAt: null } },
      include: heartRateListInclude,
      orderBy: { measuredAt: "desc" },
      take,
    });
  }
}

export const healthRepository = new HealthRepository();

export type { CreateHealthRecordInput, CreateVaccinationInput };
