import type { Prisma } from "../../generated/prisma/client.ts";
import type { NotificationType } from "../../generated/prisma/enums.ts";
import { prisma, type Db } from "../../db/prisma.ts";
import { NotFoundError } from "../../shared/errors.ts";
import { buildPageMeta, type NormalizedPagination } from "../../shared/pagination.ts";
import type { Paginated } from "../../shared/types.ts";
import {
  conversationDetailInclude,
  conversationInclude,
  notificationInclude,
  type ConversationDetailWithRelations,
  type ConversationWithRelations,
  type ConversationStatusValue,
  type ListMessagingNotificationsQuery,
  type ListMessagingQuery,
  type NotificationWithRelations,
} from "./messaging.types.ts";

export class MessagingRepository {
  constructor(private readonly db: Db = prisma) {}

  async list(
    query: ListMessagingQuery,
    pagination: NormalizedPagination,
  ): Promise<Paginated<ConversationWithRelations>> {
    const search = query.q?.trim();
    const where: Prisma.ConversationWhereInput = {
      deletedAt: null,
      ...(query.status && query.status !== "all" ? { status: query.status } : {}),
      ...(query.context && query.context !== "all"
        ? { contextType: query.context }
        : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" } },
              {
                participants: {
                  some: {
                    user: {
                      OR: [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              },
              {
                messages: {
                  some: {
                    isDeleted: false,
                    messageBody: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const items = await this.db.conversation.findMany({
      where,
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });
    const total = await this.db.conversation.count({ where });

    return { items, meta: buildPageMeta(total, pagination) };
  }

  findDirectConversation(adminUserId: string, userId: string) {
    return this.db.conversation.findFirst({
      where: {
        deletedAt: null,
        contextType: "general",
        AND: [
          { participants: { some: { userId: adminUserId } } },
          { participants: { some: { userId } } },
          { participants: { every: { userId: { in: [adminUserId, userId] } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: conversationInclude,
    });
  }

  createConversation(
    adminUserId: string,
    userId: string,
    body: string,
  ): Promise<ConversationWithRelations> {
    return this.db.$transaction((tx) =>
      tx.conversation.create({
        data: {
          contextType: "general",
          participants: {
            create: [{ userId: adminUserId }, { userId }],
          },
          messages: {
            create: [{ senderUserId: adminUserId, messageBody: body }],
          },
        },
        include: conversationInclude,
      }),
    );
  }

  async getById(id: string): Promise<ConversationDetailWithRelations> {
    const conversation = await this.db.conversation.findFirst({
      where: { id, deletedAt: null },
      include: conversationDetailInclude,
    });
    if (!conversation) throw new NotFoundError("Conversation");
    return conversation;
  }

  countUnread(conversationId: string, userId: string, since: Date | null) {
    return this.db.message.count({
      where: {
        conversationId,
        isDeleted: false,
        senderUserId: { not: userId },
        ...(since ? { sentAt: { gt: since } } : {}),
      },
    });
  }

  upsertParticipantRead(conversationId: string, userId: string) {
    return this.db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId, lastReadAt: new Date() },
    });
  }

  async createMessage(
    conversationId: string,
    senderUserId: string,
    body: string,
    attachmentUrl?: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderUserId, messageBody: body, attachmentUrl },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
              role: { select: { roleName: true } },
            },
          },
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      await tx.conversationParticipant.updateMany({
        where: { conversationId, userId: senderUserId },
        data: { lastReadAt: new Date() },
      });
      return created;
    });
  }

  updateStatus(
    id: string,
    status: ConversationStatusValue,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.conversation.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  assign(
    id: string,
    assignedToUserId: string | null,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.conversation.update({
      where: { id },
      data: { assignedToUserId },
      include: conversationInclude,
    });
  }

  addParticipant(
    conversationId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: {},
      create: { conversationId, userId },
    });
  }

  removeParticipant(
    conversationId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });
  }

  getMessage(id: string) {
    return this.db.message.findFirst({
      where: { id },
      select: {
        id: true,
        conversationId: true,
        senderUserId: true,
        isDeleted: true,
      },
    });
  }

  softDeleteMessage(id: string, tx: Prisma.TransactionClient = this.db) {
    return tx.message.update({ where: { id }, data: { isDeleted: true } });
  }

  hideMessageForUser(
    messageId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.db,
  ) {
    return tx.messageDeletion.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId },
    });
  }

  searchUsers(q: string, excludeIds: string[]) {
    const search = q.trim();
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        accountStatus: "active",
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ roleId: "asc" }, { firstName: "asc" }],
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePhotoUrl: true,
        role: { select: { roleName: true } },
      },
    });
  }

  async listNotifications(
    recipientUserId: string,
    query: ListMessagingNotificationsQuery,
    pagination: NormalizedPagination,
  ): Promise<Paginated<NotificationWithRelations>> {
    const search = query.q?.trim();
    const where: Prisma.NotificationWhereInput = {
      recipientUserId,
      ...(query.type && query.type !== "all"
        ? { notificationType: query.type as NotificationType }
        : {}),
      ...(query.read === "read" ? { isRead: true } : {}),
      ...(query.read === "unread" ? { isRead: false } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { body: { contains: search, mode: "insensitive" } },
              {
                recipient: {
                  OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const items = await this.db.notification.findMany({
      where,
      include: notificationInclude,
      orderBy: { sentAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });
    const total = await this.db.notification.count({ where });

    return { items, meta: buildPageMeta(total, pagination) };
  }

  notificationCounts(recipientUserId: string) {
    return this.db.notification.groupBy({
      by: ["isRead"],
      where: { recipientUserId },
      _count: { _all: true },
    });
  }

  markNotificationRead(id: string, isRead: boolean, recipientUserId: string) {
    return this.db.notification.updateMany({
      where: { id, recipientUserId },
      data: { isRead, readAt: isRead ? new Date() : null },
    });
  }

  markAllNotificationsRead(recipientUserId: string) {
    return this.db.notification.updateMany({
      where: { recipientUserId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async lastMessages() {
    return this.db.conversation.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        status: true,
        participants: { select: { userId: true, lastReadAt: true } },
        messages: {
          where: { isDeleted: false },
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { senderUserId: true },
        },
      },
    });
  }

  /** Unread messages across every conversation the user participates in. */
  async unreadForUser(userId: string): Promise<number> {
    const conversations = await this.db.conversation.findMany({
      where: { deletedAt: null, participants: { some: { userId } } },
      select: {
        id: true,
        participants: {
          where: { userId },
          select: { lastReadAt: true },
        },
      },
    });

    let total = 0;
    for (const conversation of conversations) {
      total += await this.countUnread(
        conversation.id,
        userId,
        conversation.participants[0]?.lastReadAt ?? null,
      );
    }
    return total;
  }
}

export const messagingRepository = new MessagingRepository();
