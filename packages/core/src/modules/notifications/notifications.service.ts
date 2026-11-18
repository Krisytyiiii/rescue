import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../../db/prisma.ts";
import { buildPageMeta, normalizePagination } from "../../shared/pagination.ts";
import type { Paginated } from "../../shared/types.ts";
import { NotificationsRepository, notificationsRepository } from "./notifications.repository.ts";
import type { CreateNotificationInput, ListNotificationsQuery } from "./notifications.types.ts";

export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository = notificationsRepository) {}

  async notify(input: CreateNotificationInput, tx?: Prisma.TransactionClient) {
    return this.repo.create(input, tx);
  }

  /** Fan-out to every admin. Used for new reports and pending moderation. */
  async notifyAdmins(
    input: Omit<CreateNotificationInput, "recipientUserId">,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    const admins = await client.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        role: { roleName: "admin" },
      },
      select: { id: true },
    });

    return this.repo.createMany(
      admins.map((admin) => ({ ...input, recipientUserId: admin.id })),
      tx,
    );
  }

  async list(
    recipientUserId: string,
    query: ListNotificationsQuery = {},
  ): Promise<Paginated<Awaited<ReturnType<NotificationsRepository["list"]>>[0][number]>> {
    const pagination = normalizePagination(query);
    const [items, total] = await this.repo.list(recipientUserId, query, pagination.skip, pagination.take);
    return { items, meta: buildPageMeta(total, pagination) };
  }

  markRead(id: string, recipientUserId: string) {
    return this.repo.markRead(id, recipientUserId);
  }

  markAllRead(recipientUserId: string) {
    return this.repo.markAllRead(recipientUserId);
  }

  unreadCount(recipientUserId: string) {
    return this.repo.unreadCount(recipientUserId);
  }
}

export const notificationsService = new NotificationsService();
