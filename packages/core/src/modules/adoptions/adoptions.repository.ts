import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { NormalizedPagination } from "../../shared/pagination.ts";
import type { Paginated } from "../../shared/types.ts";
import {
  OPEN_ADOPTION_STATUSES,
  adoptionDetailInclude,
  type AdoptionDetail,
  type ListAdoptionsQuery,
} from "./adoptions.types.ts";

export class AdoptionsRepository {
  constructor(private readonly db: Db = prisma) {}

  async nextRequestCode(tx: Prisma.TransactionClient = this.db): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ code: string }>>`
      SELECT 'ADO-' || to_char(now(), 'YYYY') || '-' ||
             lpad(nextval('adoption_request_code_seq')::text, 5, '0') AS code
    `;
    const code = rows[0]?.code;
    if (!code) throw new Error("Failed to generate adoption request code");
    return code;
  }

  create(data: Prisma.AdoptionRequestUncheckedCreateInput, tx: Prisma.TransactionClient = this.db) {
    return tx.adoptionRequest.create({ data, include: adoptionDetailInclude });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.db) {
    return tx.adoptionRequest.findFirst({
      where: { id, deletedAt: null },
      include: adoptionDetailInclude,
    });
  }

  async getById(id: string) {
    const request = await this.findById(id);
    if (!request) throw new NotFoundError("Adoption request");
    return request;
  }

  findActiveForAnimal(animalId: string) {
    return this.db.adoptionRequest.findMany({
      where: {
        animalId,
        deletedAt: null,
        status: { in: [...OPEN_ADOPTION_STATUSES] },
      },
      include: adoptionDetailInclude,
    });
  }

  findOpenForAdopter(animalId: string, adopterUserId: string) {
    return this.db.adoptionRequest.findFirst({
      where: {
        animalId,
        adopterUserId,
        deletedAt: null,
        status: { in: [...OPEN_ADOPTION_STATUSES] },
      },
    });
  }

  async list(
    query: ListAdoptionsQuery,
    pagination: NormalizedPagination,
  ): Promise<Paginated<AdoptionDetail>> {
    const where: Prisma.AdoptionRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.animalId ? { animalId: query.animalId } : {}),
      ...(query.adopterUserId ? { adopterUserId: query.adopterUserId } : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.adoptionRequest.findMany({
        where,
        include: adoptionDetailInclude,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.db.adoptionRequest.count({ where }),
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

  update(id: string, data: Prisma.AdoptionRequestUpdateInput, tx: Prisma.TransactionClient = this.db) {
    return tx.adoptionRequest.update({ where: { id }, data, include: adoptionDetailInclude });
  }

  updateMany(
    ids: string[],
    data: Prisma.AdoptionRequestUpdateManyMutationInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.adoptionRequest.updateMany({ where: { id: { in: ids } }, data });
  }

  createFollowup(
    data: Prisma.AdoptionFollowupUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.adoptionFollowup.create({ data });
  }
}

export const adoptionsRepository = new AdoptionsRepository();
