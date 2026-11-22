import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireActor, requireRole, isStaff } from "../../shared/authz.ts";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import { normalizePagination } from "../../shared/pagination.ts";
import type { Actor } from "../../shared/types.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { AnimalsRepository, animalsRepository } from "./animals.repository.ts";
import {
  ANIMAL_LIFECYCLE_TRANSITIONS,
  animalDetailInclude,
  type CreateAnimalInput,
  type ListAnimalsQuery,
  type UpdateAnimalInput,
} from "./animals.types.ts";
import type { LifecycleStatus, ListingStatus } from "../../generated/prisma/enums.ts";

export class AnimalsService {
  constructor(private readonly repo: AnimalsRepository = animalsRepository) {}

  async create(input: CreateAnimalInput, actor?: Actor) {
    const current = requireActor(actor);
    const isCommunityPost = input.originType === "community_post";

    if (isCommunityPost && !["community_user", "admin"].includes(current.role)) {
      throw new ForbiddenError("Only community users can submit adoption posts");
    }
    if (!isCommunityPost) {
      requireRole(current, "admin", "rescuer");
    }

    if (input.sourceReportId) {
      const report = await prisma.report.findFirst({
        where: { id: input.sourceReportId, deletedAt: null },
        select: { id: true },
      });
      if (!report) throw new NotFoundError("Source report");
    }

    // Community submissions always wait for moderation. Staff control their own visibility.
    const listingStatus: ListingStatus =
      isCommunityPost
        ? "pending_review"
        : (input.listingStatus ?? (current.role === "admin" ? "draft" : "pending_review"));

    const animal = await prisma.$transaction(async (tx) => {
      const animalCode = await this.repo.nextAnimalCode(tx);

      const created = await this.repo.create(
        {
          animalCode,
          name: input.name,
          species: input.species,
          breedType: input.breedType,
          sex: input.sex,
          estimatedAgeMonths: input.estimatedAgeMonths,
          size: input.size,
          colorMarkings: input.colorMarkings,
          temperament: input.temperament,
          weightKg: input.weightKg,
          isNeutered: input.isNeutered ?? false,
          microchipNo: input.microchipNo,
          originType: input.originType,
          sourceReportId: input.sourceReportId,
          postedByUserId: isCommunityPost ? current.userId : null,
          lifecycleStatus: isCommunityPost ? "reported" : "under_care",
          listingStatus,
          intakeDate: input.intakeDate ?? new Date(),
          description: input.description,
          ...(input.media?.length
            ? {
                media: {
                  create: input.media.map((item) => ({
                    mediaType: item.mediaType,
                    fileUrl: item.fileUrl,
                    caption: item.caption,
                    sortOrder: item.sortOrder,
                    uploadedBy: current.userId,
                  })),
                },
              }
            : {}),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: current.userId,
        action: "create_animal",
        entityType: "animal",
        entityId: created.id,
        newValue: {
          animalCode: created.animalCode,
          originType: created.originType,
          listingStatus: created.listingStatus,
        },
      });

      if (isCommunityPost) {
        await notificationsService.notifyAdmins(
          {
            notificationType: "system",
            title: "Adoption post pending review",
            body: `${created.animalCode}${created.name ? ` (${created.name})` : ""} was submitted for review.`,
            referenceType: "animal",
            referenceId: created.id,
          },
          tx,
        );
      }

      return created;
    });

    return animal;
  }

  async list(query: ListAnimalsQuery, actor?: Actor) {
    const pagination = normalizePagination(query);
    const publicOnly = !isStaff(actor);
    return this.repo.list(query, pagination, publicOnly);
  }

  /**
   * Community adoption feed. Published posts are public; a resident also sees
   * their own submissions while those wait for staff review.
   */
  async listCommunityFeed(actor?: Actor) {
    const current = requireActor(actor);
    const items = await this.repo.listCommunityFeed(
      current.userId,
      !isStaff(current),
    );
    return { items };
  }

  async getById(id: string, actor?: Actor) {
    const animal = await this.repo.getById(id);
    if (!isStaff(actor) && animal.listingStatus !== "published") {
      throw new NotFoundError("Animal");
    }
    return animal;
  }

  async getByCode(code: string, actor?: Actor) {
    const animal = await this.repo.findByCode(code);
    if (!animal) throw new NotFoundError("Animal");
    if (!isStaff(actor) && animal.listingStatus !== "published") {
      throw new NotFoundError("Animal");
    }
    return animal;
  }

  async update(id: string, input: UpdateAnimalInput, actor?: Actor) {
    const staff = requireRole(actor, "admin", "rescuer");
    const before = await this.repo.getById(id);

    if (input.listingStatus && staff.role !== "admin") {
      throw new ForbiddenError("Only administrators can change listing visibility");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(id, input, tx);

      await writeAuditLog(tx, {
        userId: staff.userId,
        action: "update_animal",
        entityType: "animal",
        entityId: id,
        oldValue: { listingStatus: before.listingStatus },
        newValue: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue,
      });

      return updated;
    });
  }

  async updateLifecycle(
    id: string,
    status: LifecycleStatus,
    remarks: string | undefined,
    actor?: Actor,
  ) {
    const staff = requireRole(actor, "admin", "rescuer");
    const animal = await this.repo.getById(id);

    if (!ANIMAL_LIFECYCLE_TRANSITIONS[animal.lifecycleStatus].includes(status)) {
      throw new ConflictError(
        `Cannot move animal from "${animal.lifecycleStatus}" to "${status}"`,
      );
    }

    if (status === "available") {
      const [records, vaccinations, heartRates] = await Promise.all([
        prisma.healthRecord.count({ where: { animalId: id } }),
        prisma.vaccination.count({ where: { animalId: id } }),
        prisma.heartRateLog.count({ where: { animalId: id } }),
      ]);

      const missing = [
        records === 0 ? "a medical note" : null,
        vaccinations === 0 ? "a vaccination record" : null,
        heartRates === 0 ? "a heart rate reading" : null,
      ].filter(Boolean);

      if (missing.length > 0) {
        throw new ConflictError(
          `Add ${missing.join(", ")} before marking this animal ready for adoption.`,
        );
      }
    }

    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(
        id,
        {
          lifecycleStatus: status,
          ...(status === "adopted" ? { adoptedDate: now, listingStatus: "archived" } : {}),
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: staff.userId,
        action: "update_animal_lifecycle",
        entityType: "animal",
        entityId: id,
        oldValue: { lifecycleStatus: animal.lifecycleStatus },
        newValue: { lifecycleStatus: status, remarks: remarks ?? null },
      });

      return updated;
    });
  }

  async moderateListing(
    id: string,
    listingStatus: Extract<ListingStatus, "published" | "rejected" | "archived">,
    remarks: string | undefined,
    actor?: Actor,
  ) {
    const admin = requireRole(actor, "admin");
    const animal = await this.repo.getById(id);

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(id, { listingStatus }, tx);

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "moderate_animal_listing",
        entityType: "animal",
        entityId: id,
        oldValue: { listingStatus: animal.listingStatus },
        newValue: { listingStatus, remarks: remarks ?? null },
      });

      if (animal.postedByUserId) {
        await notificationsService.notify(
          {
            recipientUserId: animal.postedByUserId,
            notificationType: "system",
            title:
              listingStatus === "published"
                ? "Your adoption post is live"
                : `Your adoption post was ${listingStatus}`,
            body: remarks ?? `${animal.animalCode} is now ${listingStatus}.`,
            referenceType: "animal",
            referenceId: id,
          },
          tx,
        );
      }

      return updated;
    });
  }

  async archive(id: string, actor?: Actor) {
    const admin = requireRole(actor, "admin");
    await this.repo.getById(id);

    return prisma.$transaction(async (tx) => {
      await this.repo.archive(id, tx);
      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "archive_animal",
        entityType: "animal",
        entityId: id,
      });
    });
  }

  async getCounts() {
    const [inCare, available, adopted] = await prisma.$transaction([
      prisma.animal.count({
        where: { lifecycleStatus: { in: ["rescued", "under_care"] }, deletedAt: null },
      }),
      prisma.animal.count({ where: { lifecycleStatus: "available", deletedAt: null } }),
      prisma.animal.count({ where: { lifecycleStatus: "adopted", deletedAt: null } }),
    ]);
    return { inCare, available, adopted };
  }

  /** Counts for the admin animals console, including the moderation queue. */
  async getAdminCounts() {
    const [total, inCare, available, adoptionPending, adopted, pendingReview] =
      await prisma.$transaction([
        prisma.animal.count({ where: { deletedAt: null } }),
        prisma.animal.count({
          where: { lifecycleStatus: { in: ["rescued", "under_care"] }, deletedAt: null },
        }),
        prisma.animal.count({ where: { lifecycleStatus: "available", deletedAt: null } }),
        prisma.animal.count({
          where: { lifecycleStatus: "adoption_pending", deletedAt: null },
        }),
        prisma.animal.count({ where: { lifecycleStatus: "adopted", deletedAt: null } }),
        prisma.animal.count({ where: { listingStatus: "pending_review", deletedAt: null } }),
      ]);

    return { total, inCare, available, adoptionPending, adopted, pendingReview };
  }

  /** Oldest community submissions waiting for a listing decision. */
  async listPendingReview(limit = 3) {
    return prisma.animal.findMany({
      where: { listingStatus: "pending_review", deletedAt: null },
      include: animalDetailInclude,
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }
}

export const animalsService = new AnimalsService();
