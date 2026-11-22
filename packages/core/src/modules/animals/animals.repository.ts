import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";
import type { NormalizedPagination } from "../../shared/pagination.ts";
import type { Paginated } from "../../shared/types.ts";
import { animalDetailInclude, type ListAnimalsQuery } from "./animals.types.ts";

export class AnimalsRepository {
  constructor(private readonly db: Db = prisma) {}

  async nextAnimalCode(tx: Prisma.TransactionClient = this.db): Promise<string> {
    const rows = await tx.$queryRaw<Array<{ code: string }>>`
      SELECT 'FR-' || to_char(now(), 'YYYY') || '-' ||
             lpad(nextval('animal_code_seq')::text, 4, '0') AS code
    `;
    const code = rows[0]?.code;
    if (!code) throw new Error("Failed to generate animal code");
    return code;
  }

  create(
    data: Prisma.AnimalUncheckedCreateInput,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.animal.create({ data, include: animalDetailInclude });
  }

  findById(id: string) {
    return this.db.animal.findFirst({
      where: { id, deletedAt: null },
      include: animalDetailInclude,
    });
  }

  findByCode(code: string) {
    return this.db.animal.findFirst({
      where: { animalCode: code, deletedAt: null },
      include: animalDetailInclude,
    });
  }

  async getById(id: string) {
    const animal = await this.findById(id);
    if (!animal) throw new NotFoundError("Animal");
    return animal;
  }

  async list(
    query: ListAnimalsQuery,
    pagination: NormalizedPagination,
    publicOnly: boolean,
  ): Promise<Paginated<Awaited<ReturnType<AnimalsRepository["getById"]>>>> {    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
      ...(publicOnly
        ? { listingStatus: "published", lifecycleStatus: { notIn: ["deceased", "returned_to_owner"] } }
        : {}),
      ...(query.availableOnly ? { lifecycleStatus: "available" } : {}),
      ...(query.species ? { species: query.species } : {}),
      ...(query.sex ? { sex: query.sex } : {}),
      ...(query.size ? { size: query.size } : {}),
      ...(query.lifecycleStatus ? { lifecycleStatus: query.lifecycleStatus } : {}),
      ...(query.listingStatus ? { listingStatus: query.listingStatus } : {}),
      ...(query.originType ? { originType: query.originType } : {}),
      ...(query.postedByUserId ? { postedByUserId: query.postedByUserId } : {}),
      ...(query.search
        ? {
            OR: [
              { animalCode: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.animal.findMany({
        where,
        include: animalDetailInclude,
        orderBy: [{ createdAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.db.animal.count({ where }),
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

  /**
   * Community adoption feed. Everyone sees published posts; a signed-in
   * resident also sees their own submissions while they wait for review.
   */
  async listCommunityFeed(actorId: string, includeOwnPosts: boolean) {
    const where: Prisma.AnimalWhereInput = {
      deletedAt: null,
      originType: "community_post",
      ...(includeOwnPosts
        ? {
            OR: [
              { listingStatus: "published" },
              { postedByUserId: actorId },
            ],
          }
        : { listingStatus: "published" }),
    };

    return this.db.animal.findMany({
      where,
      include: animalDetailInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  update(id: string, data: Prisma.AnimalUpdateInput, tx: Prisma.TransactionClient = this.db) {
    return tx.animal.update({ where: { id }, data, include: animalDetailInclude });
  }

  archive(id: string, tx: Prisma.TransactionClient = this.db) {
    return tx.animal.update({
      where: { id },
      data: { deletedAt: new Date(), listingStatus: "archived" },
    });
  }

  countByLifecycle(status: Prisma.EnumLifecycleStatusFilter["equals"]) {
    return this.db.animal.count({ where: { lifecycleStatus: status, deletedAt: null } });
  }
}

export const animalsRepository = new AnimalsRepository();
