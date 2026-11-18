import type { Prisma, ReportStatus } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { Paginated } from "../../shared/types.ts";
import type { NormalizedPagination } from "../../shared/pagination.ts";
import {
  reportDetailInclude,
  type ListReportsQuery,
  type NearbyReport,
  type ReportDetail,
} from "./reports.types.ts";

export class ReportsRepository {
  constructor(private readonly db: Db = prisma) {}

  /** Pulls the next human-readable code from a Postgres sequence (concurrency-safe). */
  async nextReportCode(tx: Prisma.TransactionClient = this.db): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ code: string }>>`
      SELECT 'RPT-' || to_char(now(), 'YYYY') || '-' ||
             lpad(nextval('report_code_seq')::text, 5, '0') AS code
    `;
    const code = rows[0]?.code;
    if (!code) throw new Error("Failed to generate report code");
    return code;
  }

  create(
    data: Prisma.ReportUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ): Promise<ReportDetail> {
    return tx.report.create({ data, include: reportDetailInclude });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.db): Promise<ReportDetail | null> {
    return tx.report.findFirst({ where: { id, deletedAt: null }, include: reportDetailInclude });
  }

  async getById(id: string): Promise<ReportDetail> {
    const report = await this.findById(id);
    if (!report) throw new NotFoundError("Report");
    return report;
  }

  async list(
    query: ListReportsQuery,
    pagination: NormalizedPagination,
  ): Promise<Paginated<ReportDetail>> {
    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
      ...(query.includeDuplicates ? {} : { duplicateOfReportId: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.reportType ? { reportType: query.reportType } : {}),
      ...(query.species ? { species: query.species } : {}),
      ...(query.urgencyLevel ? { urgencyLevel: query.urgencyLevel } : {}),
      ...(query.barangayId ? { barangayId: query.barangayId } : {}),
      ...(query.from || query.to
        ? {
            submittedAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { reportCode: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { locationLandmark: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.report.findMany({
        where,
        include: reportDetailInclude,
        orderBy: [{ submittedAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.db.report.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
        hasNext: pagination.page * pagination.pageSize < total,
        hasPrevious: pagination.page > 1,
      },
    };
  }

  updateStatus(id: string, data: Prisma.ReportUpdateInput, tx: Prisma.TransactionClient = this.db) {
    return tx.report.update({ where: { id }, data, include: reportDetailInclude });
  }

  addStatusHistory(
    data: Prisma.ReportStatusHistoryUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.reportStatusHistory.create({ data });
  }

  /**
   * Geospatial duplicate detection using the haversine formula on lat/lng.
   * Swap for PostGIS `ST_DWithin` once the geography column is enabled.
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    windowHours: number,
  ): Promise<NearbyReport[]> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const rows = await this.db.$queryRaw<
      Array<{ id: string; report_code: string; distance_meters: number; submitted_at: Date }>
    >`
      SELECT q.id, q.report_code, q.submitted_at, q.distance_meters
      FROM (
        SELECT r.id,
               r.report_code,
               r.submitted_at,
               (6371000 * acos(
                 LEAST(1, GREATEST(-1,
                   cos(radians(${latitude})) * cos(radians(r.latitude::float8)) *
                   cos(radians(r.longitude::float8) - radians(${longitude})) +
                   sin(radians(${latitude})) * sin(radians(r.latitude::float8))
                 ))
               ))) AS distance_meters
        FROM reports r
        WHERE r.deleted_at IS NULL
          AND r.status IN ('submitted', 'verified', 'assigned', 'in_progress')
          AND r.submitted_at >= ${since}
          AND r.latitude IS NOT NULL
          AND r.longitude IS NOT NULL
      ) AS q
      WHERE q.distance_meters <= ${radiusMeters}
      ORDER BY q.distance_meters ASC
      LIMIT 10
    `;

    return rows.map((row) => ({
      id: row.id,
      reportCode: row.report_code,
      distanceMeters: Number(row.distance_meters),
      submittedAt: row.submitted_at,
    }));
  }

  countByStatus(status: ReportStatus) {
    return this.db.report.count({ where: { status, deletedAt: null } });
  }

  findActiveRescuer(userId: string) {
    return this.db.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        accountStatus: "active",
        role: { roleName: { in: ["rescuer", "admin"] } },
      },
      select: { id: true, firstName: true, lastName: true },
    });
  }

  createRescueOperation(
    data: Prisma.RescueOperationUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.rescueOperation.create({ data });
  }
}

export const reportsRepository = new ReportsRepository();
