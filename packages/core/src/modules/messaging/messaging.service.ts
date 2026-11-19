import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireRole } from "../../shared/authz.ts";
import { ConflictError, NotFoundError } from "../../shared/errors.ts";
import { normalizePagination } from "../../shared/pagination.ts";
import type { Actor, Paginated } from "../../shared/types.ts";
import { notificationsService } from "../notifications/notifications.service.ts";
import { MessagingRepository, messagingRepository } from "./messaging.repository.ts";
import type {
  ConversationDetailRow,
  ConversationDetailWithRelations,
  ConversationListRow,
  ConversationStatusValue,
  ConversationWithRelations,
  ListMessagingNotificationsQuery,
  ListMessagingQuery,
  MessagingContextRow,
  MessagingCounts,
  MessagingMessageRow,
  MessagingNotificationRow,
  MessagingParticipantRow,
  NotificationCounts,
  NotificationWithRelations,
  ParticipantCandidateRow,
} from "./messaging.types.ts";

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function fullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

function toParticipant(
  participant: ConversationWithRelations["participants"][number],
): MessagingParticipantRow {
  return {
    userId: participant.userId,
    fullName: fullName(participant.user),
    email: participant.user.email,
    phoneNumber: participant.user.phoneNumber,
    role: participant.user.role.roleName,
    lastReadAt: participant.lastReadAt?.toISOString() ?? null,
  };
}

function toMessage(
  message:
    | ConversationWithRelations["messages"][number]
    | ConversationDetailWithRelations["messages"][number],
): MessagingMessageRow {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    senderName: fullName(message.sender),
    senderRole: message.sender.role.roleName,
    body: message.messageBody,
    attachmentUrl: message.attachmentUrl,
    sentAt: message.sentAt.toISOString(),
    isDeleted: message.isDeleted,
  };
}

function toNotification(
  notification: NotificationWithRelations,
): MessagingNotificationRow {
  return {
    id: notification.id,
    type: notification.notificationType,
    title: notification.title,
    body: notification.body,
    recipientUserId: notification.recipientUserId,
    recipientName: fullName(notification.recipient),
    recipientEmail: notification.recipient.email,
    recipientRole: notification.recipient.role.roleName,
    channel: notification.channel,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() ?? null,
    sentAt: notification.sentAt.toISOString(),
    referenceType: notification.referenceType,
    referenceId: notification.referenceId,
  };
}

function generalContext(conversation: {
  contextType: "report" | "adoption_request" | "general";
  subject: string | null;
}): MessagingContextRow {
  return {
    kind: conversation.contextType,
    code: null,
    title: "General inquiry",
    subtitle: conversation.subject,
    href: null,
  };
}

export class MessagingService {
  constructor(private readonly repo: MessagingRepository = messagingRepository) {}

  private async contexts(conversations: ConversationWithRelations[]) {
    const reportIds = conversations
      .filter(
        (conversation) =>
          conversation.contextType === "report" && conversation.contextId,
      )
      .map((conversation) => conversation.contextId!) as string[];
    const adoptionIds = conversations
      .filter(
        (conversation) =>
          conversation.contextType === "adoption_request" && conversation.contextId,
      )
      .map((conversation) => conversation.contextId!) as string[];

    const [reports, adoptions] = await Promise.all([
      reportIds.length
        ? prisma.report.findMany({
            where: { id: { in: reportIds } },
            select: {
              id: true,
              reportCode: true,
              status: true,
              locationLandmark: true,
            },
          })
        : [],
      adoptionIds.length
        ? prisma.adoptionRequest.findMany({
            where: { id: { in: adoptionIds } },
            select: {
              id: true,
              requestCode: true,
              status: true,
              animal: { select: { name: true, animalCode: true } },
            },
          })
        : [],
    ]);

    const map = new Map<string, MessagingContextRow>();
    for (const report of reports) {
      map.set(`report:${report.id}`, {
        kind: "report",
        code: report.reportCode,
        title: report.locationLandmark ?? "Reported animal",
        subtitle: humanize(report.status),
        href: `/admin/reports?q=${encodeURIComponent(report.reportCode)}`,
      });
    }
    for (const adoption of adoptions) {
      map.set(`adoption_request:${adoption.id}`, {
        kind: "adoption_request",
        code: adoption.requestCode,
        title: adoption.animal.name?.trim() || adoption.animal.animalCode,
        subtitle: humanize(adoption.status),
        href: `/admin/adoptions?q=${encodeURIComponent(adoption.requestCode)}`,
      });
    }
    return map;
  }

  private async decorate(
    conversations: ConversationWithRelations[],
    actor: Actor,
  ): Promise<ConversationListRow[]> {
    const contextMap = await this.contexts(conversations);

    return Promise.all(
      conversations.map(async (conversation) => {
        const mine = conversation.participants.find(
          (participant) => participant.userId === actor.userId,
        );
        const unreadCount = await this.repo.countUnread(
          conversation.id,
          actor.userId,
          mine?.lastReadAt ?? null,
        );
        const lastMessage = conversation.messages[0]
          ? toMessage(conversation.messages[0])
          : null;

        return {
          id: conversation.id,
          contextType: conversation.contextType,
          contextId: conversation.contextId,
          subject: conversation.subject,
          status: conversation.status,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          assignee: conversation.assignee
            ? {
                userId: conversation.assignee.id,
                fullName: fullName(conversation.assignee),
              }
            : null,
          participants: conversation.participants.map(toParticipant),
          lastMessage,
          messageCount: conversation._count.messages,
          unreadCount,
          needsReply: Boolean(lastMessage && lastMessage.senderUserId !== actor.userId),
          context:
            contextMap.get(`${conversation.contextType}:${conversation.contextId}`) ??
            generalContext(conversation),
        };
      }),
    );
  }

  async list(
    query: ListMessagingQuery,
    actor?: Actor,
  ): Promise<Paginated<ConversationListRow>> {
    requireRole(actor, "admin");
    const pagination = normalizePagination(query);
    const page = await this.repo.list(query, pagination);
    return { items: await this.decorate(page.items, actor!), meta: page.meta };
  }

  async getById(id: string, actor?: Actor): Promise<ConversationDetailRow> {
    requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);
    const [row] = await this.decorate([conversation], actor!);
    return {
      ...row!,
      messages: conversation.messages.map(toMessage),
    };
  }

  async searchMessageCandidates(q: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const users = await this.repo.searchUsers(q, [current.userId]);
    return users.map<ParticipantCandidateRow>((user) => ({
      userId: user.id,
      fullName: fullName(user),
      email: user.email,
      role: user.role.roleName,
    }));
  }

  /**
   * Starts a person-to-person conversation with the selected user. If an open
   * direct thread already exists it is reused, the same way a messaging app
   * keeps one thread per person.
   */
  async startConversation(
    input: { userId: string; body: string },
    actor?: Actor,
  ): Promise<ConversationDetailRow> {
    const current = requireRole(actor, "admin");
    if (input.userId === current.userId) {
      throw new ConflictError("Choose someone else to message");
    }

    const user = await prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null, accountStatus: "active" },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundError("Person");

    const existing = await this.repo.findDirectConversation(
      current.userId,
      input.userId,
    );

    let conversationId: string;
    if (existing) {
      conversationId = existing.id;
      if (existing.status === "closed") {
        await this.repo.updateStatus(existing.id, "open");
      }
      await this.repo.createMessage(existing.id, current.userId, input.body);
    } else {
      const created = await this.repo.createConversation(
        current.userId,
        input.userId,
        input.body,
      );
      conversationId = created.id;
      await prisma.$transaction((tx) =>
        writeAuditLog(tx, {
          userId: current.userId,
          action: "start_conversation",
          entityType: "conversation",
          entityId: conversationId,
          newValue: { userId: input.userId },
        }),
      );
    }

    await notificationsService.notify({
      recipientUserId: input.userId,
      notificationType: "new_message",
      title: "New message from FuRescue",
      body: input.body.slice(0, 200),
      referenceType: "conversation",
      referenceId: conversationId,
    });

    return this.getById(conversationId, current);
  }

  async markRead(id: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    await this.repo.getById(id);
    await this.repo.upsertParticipantRead(id, current.userId);
    return { id };
  }

  async send(
    id: string,
    input: { body: string; attachmentUrl?: string },
    actor?: Actor,
  ) {
    const current = requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);
    if (conversation.status === "closed") {
      throw new ConflictError("Reopen this conversation before replying");
    }

    const message = await this.repo.createMessage(
      id,
      current.userId,
      input.body,
      input.attachmentUrl,
    );

    const recipients = conversation.participants.filter(
      (participant) => participant.userId !== current.userId,
    );
    await Promise.all(
      recipients.map((participant) =>
        notificationsService.notify({
          recipientUserId: participant.userId,
          notificationType: "new_message",
          title: "New message from FuRescue",
          body: input.body.slice(0, 200),
          referenceType: "conversation",
          referenceId: id,
        }),
      ),
    );

    return toMessage(message);
  }

  async setStatus(id: string, status: ConversationStatusValue, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);

    await prisma.$transaction(async (tx) => {
      await this.repo.updateStatus(id, status, tx);
      await writeAuditLog(tx, {
        userId: current.userId,
        action: status === "closed" ? "close_conversation" : "reopen_conversation",
        entityType: "conversation",
        entityId: id,
        oldValue: { status: conversation.status },
        newValue: { status },
      });
    });

    return { id, status };
  }

  async assign(id: string, userId: string | null, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);

    if (userId) {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
          accountStatus: "active",
          role: { roleName: "admin" },
        },
        select: { id: true },
      });
      if (!user) throw new NotFoundError("Admin");
    }

    await prisma.$transaction(async (tx) => {
      await this.repo.assign(id, userId, tx);
      await writeAuditLog(tx, {
        userId: current.userId,
        action: userId ? "assign_conversation" : "unassign_conversation",
        entityType: "conversation",
        entityId: id,
        oldValue: { assignedToUserId: conversation.assignedToUserId },
        newValue: { assignedToUserId: userId },
      });
    });

    return { id, assignedToUserId: userId };
  }

  async addParticipant(id: string, userId: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);

    if (conversation.participants.some((participant) => participant.userId === userId)) {
      throw new ConflictError("This person is already in the conversation");
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, accountStatus: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { roleName: true } },
      },
    });
    if (!user) throw new NotFoundError("Person");

    await prisma.$transaction(async (tx) => {
      await this.repo.addParticipant(id, userId, tx);
      await writeAuditLog(tx, {
        userId: current.userId,
        action: "add_participant",
        entityType: "conversation",
        entityId: id,
        newValue: { userId },
      });
      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    });

    await notificationsService.notify({
      recipientUserId: userId,
      notificationType: "new_message",
      title: "You were added to a FuRescue conversation",
      body: conversation.subject ?? "A staff member added you to a conversation.",
      referenceType: "conversation",
      referenceId: id,
    });

    return {
      userId: user.id,
      fullName: fullName(user),
      email: user.email,
      role: user.role.roleName,
    };
  }

  async removeParticipant(id: string, userId: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);
    const target = conversation.participants.find(
      (participant) => participant.userId === userId,
    );
    if (!target) throw new NotFoundError("Participant");

    const admins = conversation.participants.filter(
      (participant) => participant.user.role.roleName === "admin",
    );
    if (target.user.role.roleName === "admin" && admins.length <= 1) {
      throw new ConflictError("A conversation needs at least one admin");
    }

    await prisma.$transaction(async (tx) => {
      await this.repo.removeParticipant(id, userId, tx);
      await writeAuditLog(tx, {
        userId: current.userId,
        action: "remove_participant",
        entityType: "conversation",
        entityId: id,
        oldValue: { userId },
      });
    });

    return { userId };
  }

  async deleteMessage(messageId: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const message = await this.repo.getMessage(messageId);
    if (!message) throw new NotFoundError("Message");
    if (message.isDeleted) return { id: messageId, conversationId: message.conversationId };

    await prisma.$transaction(async (tx) => {
      await this.repo.softDeleteMessage(messageId, tx);
      await writeAuditLog(tx, {
        userId: current.userId,
        action: "delete_message",
        entityType: "message",
        entityId: messageId,
        oldValue: { conversationId: message.conversationId },
      });
    });

    return { id: messageId, conversationId: message.conversationId };
  }

  async searchParticipants(id: string, q: string, actor?: Actor) {
    requireRole(actor, "admin");
    const conversation = await this.repo.getById(id);
    const existing = new Set(
      conversation.participants.map((participant) => participant.userId),
    );
    const users = await this.repo.searchUsers(q, [...existing]);
    return users.map<ParticipantCandidateRow>((user) => ({
      userId: user.id,
      fullName: fullName(user),
      email: user.email,
      role: user.role.roleName,
    }));
  }

  async listNotifications(
    query: ListMessagingNotificationsQuery,
    actor?: Actor,
  ): Promise<Paginated<MessagingNotificationRow>> {
    const current = requireRole(actor, "admin");
    const pagination = normalizePagination(query);
    const page = await this.repo.listNotifications(
      current.userId,
      query,
      pagination,
    );
    return {
      items: page.items.map(toNotification),
      meta: page.meta,
    };
  }

  async getNotificationCounts(actor?: Actor): Promise<NotificationCounts> {
    const current = requireRole(actor, "admin");
    const groups = await this.repo.notificationCounts(current.userId);
    let read = 0;
    let unread = 0;
    for (const group of groups) {
      if (group.isRead) read += group._count._all;
      else unread += group._count._all;
    }
    return { total: read + unread, read, unread };
  }

  async markNotificationRead(id: string, isRead: boolean, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const result = await this.repo.markNotificationRead(id, isRead, current.userId);
    if (result.count === 0) throw new NotFoundError("Notification");
    return { id, isRead };
  }

  async markAllNotificationsRead(actor?: Actor) {
    const current = requireRole(actor, "admin");
    const result = await this.repo.markAllNotificationsRead(current.userId);
    return { updated: result.count };
  }

  async getCounts(actor?: Actor): Promise<MessagingCounts> {
    const current = requireRole(actor, "admin");
    const conversations = await this.repo.lastMessages();
    let needsReply = 0;
    let unread = 0;

    for (const conversation of conversations) {
      const lastMessage = conversation.messages[0];
      if (lastMessage && lastMessage.senderUserId !== current.userId) needsReply += 1;

      const mine = conversation.participants.find(
        (participant) => participant.userId === current.userId,
      );
      unread += await this.repo.countUnread(
        conversation.id,
        current.userId,
        mine?.lastReadAt ?? null,
      );
    }

    return {
      open: conversations.filter((conversation) => conversation.status === "open").length,
      closed: conversations.filter((conversation) => conversation.status === "closed").length,
      needsReply,
      unread,
      total: conversations.length,
    };
  }
}

export const messagingService = new MessagingService();
