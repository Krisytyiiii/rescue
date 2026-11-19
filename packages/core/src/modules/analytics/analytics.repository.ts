import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import type { AnalyticsFilters, AnalyticsSpeciesFilter } from "./analytics.types.ts";

function reportWhere(
  filters: Pick<AnalyticsFilters, "from" | "to" | "barangayId" | "species">,
): Prisma.ReportWhereInput {
  return {
    deletedAt: null,
    submittedAt: { gte: filters.from, lte: filters.to },
    ...(filters.barangayId ? { barangayId: filters.barangayId } : {}),
    ...(filters.species !== "all" ? { species: filters.species } : {}),
  };
}

function adoptionSpecies(species: AnalyticsSpeciesFilter) {
  return species === "all" || species === "unknown" ? undefined : species;
}

function adoptionWhere(
  filters: Pick<AnalyticsFilters, "from" | "to" | "barangayId" | "species">,
): Prisma.AdoptionRequestWhereInput {
  const species = adoptionSpecies(filters.species);
  return {
    deletedAt: null,
    createdAt: { gte: filters.from, lte: filters.to },
    ...(filters.barangayId ? { adopter: { barangayId: filters.barangayId } } : {}),
    ...(species ? { animal: { species } } : {}),
  };
}

export class AnalyticsRepository {
  constructor(private readonly db: Db = prisma) {}

  listBarangays() {
    return this.db.barangay.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  reports(filters: AnalyticsFilters) {
    return this.db.report.findMany({
      where: reportWhere(filters),
      select: {
        id: true,
        status: true,
        submittedAt: true,
        verifiedAt: true,
        barangayId: true,
        species: true,
        urgencyLevel: true,
        latitude: true,
        longitude: true,
        duplicateOfReportId: true,
        barangay: { select: { name: true } },
      },
    });
  }

  rescues(filters: AnalyticsFilters) {
    return this.db.rescueOperation.findMany({
      where: {
        report: reportWhere(filters),
      },
      select: {
        assignmentStatus: true,
        assignedAt: true,
        arrivedAt: true,
        completedAt: true,
        animalsRescued: true,
        rescuer: { select: { id: true, firstName: true, lastName: true } },
        report: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            verifiedAt: true,
            barangayId: true,
            barangay: { select: { name: true } },
          },
        },
      },
    });
  }

  adoptions(filters: AnalyticsFilters) {
    return this.db.adoptionRequest.findMany({
      where: adoptionWhere(filters),
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        releaseDate: true,
        animal: { select: { species: true } },
        adopter: { select: { barangayId: true, barangay: { select: { name: true } } } },
        _count: { select: { followups: true } },
      },
    });
  }

  followups(filters: AnalyticsFilters) {
    return this.db.adoptionFollowup.findMany({
      where: {
        request: adoptionWhere(filters),
      },
      select: {
        requestId: true,
        request: { select: { status: true, releaseDate: true } },
      },
    });
  }

  generatedReports() {
    return this.db.generatedReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        reportKind: true,
        dateFrom: true,
        dateTo: true,
        format: true,
        fileUrl: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });
  }

  createGeneratedReport(data: Prisma.GeneratedReportUncheckedCreateInput) {
    return this.db.generatedReport.create({ data });
  }
}

export const analyticsRepository = new AnalyticsRepository();
