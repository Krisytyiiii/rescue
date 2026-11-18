import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import type { CreateNotificationInput, ListNotificationsQuery } from "./notifications.types.ts";

export class NotificationsRepository {
  constructor(private readonly db: Db = prisma) {}

  create(input: CreateNotificationInput, tx: Prisma.TransactionClient = this.db) {
    return tx.notification.create({
      data: {
        recipientUserId: input.recipientUserId,
        notificationType: input.notificationType,
        title: input.title,
        body: input.body,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        channel: input.channel ?? "in_app",
      },
    });
  }

  createMany(inputs: CreateNotificationInput[], tx: Prisma.TransactionClient = this.db) {
    if (inputs.length === 0) return Promise.resolve({ count: 0 });
    return tx.notification.createMany({
      data: inputs.map((input) => ({
        recipientUserId: input.recipientUserId,
        notificationType: input.notificationType,
        title: input.title,
        body: input.body,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        channel: input.channel ?? "in_app",
      })),
    });
  }

  list(recipientUserId: string, query: ListNotificationsQuery, skip: number, take: number) {
    const where: Prisma.NotificationWhereInput = {
      recipientUserId,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };
    return this.db.$transaction([
      this.db.notification.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip,
        take,
      }),
      this.db.notification.count({ where }),
    ]);
  }

  markRead(id: string, recipientUserId: string) {
    return this.db.notification.updateMany({
      where: { id, recipientUserId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllRead(recipientUserId: string) {
    return this.db.notification.updateMany({
      where: { recipientUserId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  unreadCount(recipientUserId: string) {
    return this.db.notification.count({ where: { recipientUserId, isRead: false } });
  }
}

export const notificationsRepository = new NotificationsRepository();
