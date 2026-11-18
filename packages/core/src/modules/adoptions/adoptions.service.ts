import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireActor, requireRole, isAdmin } from "../../shared/authz.ts";
import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors.ts";
import { normalizePagination } from "../../shared/pagination.ts";
import type { Actor } from "../../shared/types.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { AdoptionsRepository, adoptionsRepository } from "./adoptions.repository.ts";
import {
  ADOPTION_STATUS_TRANSITIONS,
  type CreateAdoptionInput,
  type ListAdoptionsQuery,
  type ReviewAdoptionInput,
} from "./adoptions.types.ts";
import type { AdoptionStatus } from "../../generated/prisma/enums.ts";

function assertTransition(from: AdoptionStatus, to: AdoptionStatus): void {
  if (!ADOPTION_STATUS_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Cannot move an adoption request from "${from}" to "${to}"`);
  }
}

export class AdoptionsService {
  constructor(private readonly repo: AdoptionsRepository = adoptionsRepository) {}

  async submit(input: CreateAdoptionInput, actor?: Actor) {
    const user = requireActor(actor);

    const animal = await prisma.animal.findFirst({
      where: { id: input.animalId, deletedAt: null },
      select: { id: true, animalCode: true, name: true, lifecycleStatus: true, listingStatus: true },
    });
    if (!animal) throw new NotFoundError("Animal");
    if (animal.listingStatus !== "published") throw new NotFoundError("Animal");
    if (!["available", "adoption_pending"].includes(animal.lifecycleStatus)) {
      throw new ConflictError("This animal is not currently open for adoption");
    }

    const existing = await this.repo.findOpenForAdopter(input.animalId, user.userId);
    if (existing) throw new ConflictError("You already have an open application for this animal");

    return prisma.$transaction(async (tx) => {
      const requestCode = await this.repo.nextRequestCode(tx);

      const created = await this.repo.create(
        {
          requestCode,
          animalId: input.animalId,
          adopterUserId: user.userId,
          housingType: input.housingType,
          isOwnedProperty: input.isOwnedProperty,
          hasFencedArea: input.hasFencedArea,
          householdMembers: input.householdMembers,
          hasOtherPets: input.hasOtherPets,
          otherPetsDetails: input.otherPetsDetails,
          priorPetExperience: input.priorPetExperience,
          reasonForAdopting: input.reasonForAdopting,
          validIdUrl: input.validIdUrl,
          homePhotoUrl: input.homePhotoUrl,
          receiptReferenceNo: input.receiptReferenceNo,
          status: "submitted",
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: user.userId,
        action: "submit_adoption_request",
        entityType: "adoption_request",
        entityId: created.id,
        newValue: { requestCode, animalCode: animal.animalCode, status: "submitted" },
      });

      await notificationsService.notifyAdmins(
        {
          notificationType: "adoption_status",
          title: "New adoption application",
          body: `${created.requestCode} for ${animal.animalCode}${animal.name ? ` (${animal.name})` : ""}`,
          referenceType: "adoption_request",
          referenceId: created.id,
        },
        tx,
      );

      return created;
    });
  }

  async list(query: ListAdoptionsQuery, actor?: Actor) {
    const user = requireActor(actor);
    // Community users only see their own applications.
    const scoped: ListAdoptionsQuery = isAdmin(actor)
      ? query
      : { ...query, adopterUserId: user.userId };

    return this.repo.list(scoped, normalizePagination(scoped));
  }

  async getById(id: string, actor?: Actor) {
    const user = requireActor(actor);
    const request = await this.repo.getById(id);
    if (!isAdmin(actor) && request.adopterUserId !== user.userId) {
      throw new ForbiddenError("You cannot view this application");
    }
    return request;
  }

  async review(id: string, input: ReviewAdoptionInput, actor?: Actor) {
    const admin = requireRole(actor, "admin");
    const current = await this.repo.getById(id);
    assertTransition(current.status, input.status);

    if (input.status === "interview_scheduled" && !input.interviewSchedule) {
      throw new ConflictError("An interview schedule is required");
    }

    // Rule: one approved request per animal; close the rest with a notification.
    if (input.status === "approved") {
      const active = await this.repo.findActiveForAnimal(current.animalId);
      const alreadyApproved = active.find(
        (request) => request.status === "approved" && request.id !== current.id,
      );
      if (alreadyApproved) {
        throw new ConflictError("Another application is already approved for this animal");
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(
        id,
        {
          status: input.status,
          reviewer: { connect: { id: admin.userId } },
          reviewedAt: new Date(),
          ...(input.decisionRemarks ? { decisionRemarks: input.decisionRemarks } : {}),
          ...(input.interviewSchedule ? { interviewSchedule: input.interviewSchedule } : {}),
        },
        tx,
      );

      if (input.status === "approved") {
        await tx.animal.update({
          where: { id: current.animalId },
          data: { lifecycleStatus: "adoption_pending" },
        });

        const others = (await this.repo.findActiveForAnimal(current.animalId)).filter(
          (request) => request.id !== current.id,
        );

        if (others.length > 0) {
          await this.repo.updateMany(
            others.map((request) => request.id),
            {
              status: "rejected",
              decisionRemarks: "Another applicant was approved for this animal",
              reviewedAt: new Date(),
            },
            tx,
          );

          for (const other of others) {
            await notificationsService.notify(
              {
                recipientUserId: other.adopterUserId,
                notificationType: "adoption_status",
                title: "Adoption application closed",
                body: `${other.requestCode}: another applicant was approved for this animal.`,
                referenceType: "adoption_request",
                referenceId: other.id,
              },
              tx,
            );
          }
        }
      }

      await notificationsService.notify(
        {
          recipientUserId: current.adopterUserId,
          notificationType: "adoption_status",
          title: `Adoption application ${input.status.replaceAll("_", " ")}`,
          body:
            input.decisionRemarks ??
            `Your application ${current.requestCode} is now ${input.status.replaceAll("_", " ")}.`,
          referenceType: "adoption_request",
          referenceId: id,
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "review_adoption_request",
        entityType: "adoption_request",
        entityId: id,
        oldValue: { status: current.status },
        newValue: { status: input.status, remarks: input.decisionRemarks ?? null },
      });

      return updated;
    });
  }

  async complete(id: string, releaseDate: Date, decisionRemarks: string | undefined, actor?: Actor) {
    const admin = requireRole(actor, "admin");
    const current = await this.repo.getById(id);
    assertTransition(current.status, "completed");

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(
        id,
        { status: "completed", releaseDate, ...(decisionRemarks ? { decisionRemarks } : {}) },
        tx,
      );

      await tx.animal.update({
        where: { id: current.animalId },
        data: { lifecycleStatus: "adopted", adoptedDate: releaseDate, listingStatus: "archived" },
      });

      await notificationsService.notify(
        {
          recipientUserId: current.adopterUserId,
          notificationType: "adoption_status",
          title: "Adoption completed",
          body: `Congratulations! ${current.requestCode} is complete. Thank you for adopting.`,
          referenceType: "adoption_request",
          referenceId: id,
        },
        tx,
      );

      await writeAuditLog(tx, {
        userId: admin.userId,
        action: "complete_adoption",
        entityType: "adoption_request",
        entityId: id,
        newValue: { status: "completed", releaseDate: releaseDate.toISOString() },
      });

      return updated;
    });
  }

  async withdraw(id: string, actor?: Actor) {
    const user = requireActor(actor);
    const current = await this.repo.getById(id);
    if (current.adopterUserId !== user.userId) {
      throw new ForbiddenError("You can only withdraw your own application");
    }
    assertTransition(current.status, "withdrawn");

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(id, { status: "withdrawn" }, tx);
      await writeAuditLog(tx, {
        userId: user.userId,
        action: "withdraw_adoption_request",
        entityType: "adoption_request",
        entityId: id,
        oldValue: { status: current.status },
        newValue: { status: "withdrawn" },
      });
      return updated;
    });
  }

  async addFollowup(
    requestId: string,
    input: {
      followupDate: Date;
      method?: "in_app" | "phone" | "visit";
      animalCondition?: string;
      remarks?: string;
    },
    actor?: Actor,
  ) {
    const admin = requireRole(actor, "admin");
    const request = await this.repo.getById(requestId);

    if (!["approved", "completed"].includes(request.status)) {
      throw new ConflictError("Follow-ups are only available after approval");
    }

    const followup = await this.repo.createFollowup({
      requestId,
      followupDate: input.followupDate,
      method: input.method,
      animalCondition: input.animalCondition,
      remarks: input.remarks,
      conductedBy: admin.userId,
    });

    await writeAuditLog(prisma, {
      userId: admin.userId,
      action: "record_adoption_followup",
      entityType: "adoption_followup",
      entityId: followup.id,
      newValue: { requestId, followupDate: input.followupDate.toISOString() },
    });

    return followup;
  }

  async getCounts() {
    const [pending, approved, completed] = await prisma.$transaction([
      prisma.adoptionRequest.count({
        where: { status: { in: ["submitted", "under_review", "interview_scheduled"] }, deletedAt: null },
      }),
      prisma.adoptionRequest.count({ where: { status: "approved", deletedAt: null } }),
      prisma.adoptionRequest.count({ where: { status: "completed", deletedAt: null } }),
    ]);
    return { pending, approved, completed };
  }
}

export const adoptionsService = new AdoptionsService();
