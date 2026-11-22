import { prisma } from "../../db/prisma.ts";
import { writeAuditLog } from "../../shared/audit.ts";
import { requireActor, requireRole } from "../../shared/authz.ts";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors.ts";
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
    profilePhotoUrl: participant.user.profilePhotoUrl,
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
    senderProfilePhotoUrl: message.sender.profilePhotoUrl,
    senderRole: message.sender.role.roleName,
    body: message.messageBody,
    attachmentUrl: message.attachmentUrl,
    sentAt: message.sentAt.toISOString(),
    isDeleted: message.isDeleted,
  };
}

/** Drops messages the viewer deleted only for themselves. */
function visibleMessages(
  messages: ConversationDetailWithRelations["messages"],
  userId: string,
): ConversationDetailWithRelations["messages"] {
  return messages.filter(
    (message) => !message.deletions.some((deletion) => deletion.userId === userId),
  );
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
      messages: visibleMessages(conversation.messages, actor!.userId).map(
        toMessage,
      ),
    };
  }

  async searchMessageCandidates(q: string, actor?: Actor) {
    const current = requireRole(actor, "admin");
    const users = await this.repo.searchUsers(q, [current.userId]);
    return users.map<ParticipantCandidateRow>((user) => ({
      userId: user.id,
      fullName: fullName(user),
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl,
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
    return this.startDirect(current, input.userId, input.body);
  }

  /**
   * A rescuer may message the dispatcher who assigned their work and the
   * reporters of reports assigned to them. The thread is reused per person.
   */
  async startRescuerConversation(
    input: { userId: string; body: string },
    actor?: Actor,
  ): Promise<ConversationDetailRow> {
    const current = requireRole(actor, "rescuer");
    if (input.userId === current.userId) {
      throw new ConflictError("Choose someone else to message");
    }
    await this.assertRescuerCanMessage(current, input.userId);
    return this.startDirect(current, input.userId, input.body);
  }

  /** Existing direct thread with one contact, or null before the first message. */
  async getRescuerDirect(
    userId: string,
    actor?: Actor,
  ): Promise<ConversationDetailRow | null> {
    const current = requireRole(actor, "rescuer");
    if (userId === current.userId) {
      throw new ConflictError("Choose someone else to message");
    }
    await this.assertRescuerCanMessage(current, userId);

    const existing = await this.repo.findDirectConversation(
      current.userId,
      userId,
    );
    if (!existing) return null;

    const conversation = await this.repo.getById(existing.id);
    const mine = conversation.participants.find(
      (participant) => participant.userId === current.userId,
    );
    const latest = conversation.messages[conversation.messages.length - 1];
    if (
      latest &&
      latest.senderUserId !== current.userId &&
      (!mine?.lastReadAt || latest.sentAt > mine.lastReadAt)
    ) {
      await this.repo.upsertParticipantRead(conversation.id, current.userId);
    }

    const [row] = await this.decorate([conversation], current);
    return {
      ...row!,
      messages: visibleMessages(conversation.messages, current.userId).map(
        toMessage,
      ),
    };
  }

  /** Reply inside a thread the rescuer is already part of. */
  async sendAsRescuer(
    id: string,
    input: { body: string; attachmentUrl?: string },
    actor?: Actor,
  ) {
    const current = requireRole(actor, "rescuer");
    const conversation = await this.repo.getById(id);
    const isParticipant = conversation.participants.some(
      (participant) => participant.userId === current.userId,
    );
    if (!isParticipant) throw new NotFoundError("Conversation");
    if (conversation.status === "closed") {
      throw new ConflictError("This conversation is closed");
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

  private async assertRescuerCanMessage(current: Actor, userId: string) {
    const allowed = await prisma.rescueOperation.findFirst({
      where: {
        rescuerUserId: current.userId,
        report: { deletedAt: null },
        OR: [
          { assignedBy: userId },
          { report: { reporterUserId: userId } },
        ],
      },
      select: { id: true },
    });
    if (!allowed) {
      throw new ConflictError(
        "You can only message your dispatcher or a reporter from your assignments",
      );
    }
  }

  private async startDirect(
    current: Actor,
    userId: string,
    body: string,
  ): Promise<ConversationDetailRow> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, accountStatus: "active" },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundError("Person");

    const existing = await this.repo.findDirectConversation(
      current.userId,
      userId,
    );

    let conversationId: string;
    if (existing) {
      conversationId = existing.id;
      if (existing.status === "closed") {
        await this.repo.updateStatus(existing.id, "open");
      }
      await this.repo.createMessage(existing.id, current.userId, body);
    } else {
      const created = await this.repo.createConversation(
        current.userId,
        userId,
        body,
      );
      conversationId = created.id;
      await prisma.$transaction((tx) =>
        writeAuditLog(tx, {
          userId: current.userId,
          action: "start_conversation",
          entityType: "conversation",
          entityId: conversationId,
          newValue: { userId },
        }),
      );
    }

    await notificationsService.notify({
      recipientUserId: userId,
      notificationType: "new_message",
      title: "New message from FuRescue",
      body: body.slice(0, 200),
      referenceType: "conversation",
      referenceId: conversationId,
    });

    const conversation = await this.repo.getById(conversationId);
    const [row] = await this.decorate([conversation], current);
    return {
      ...row!,
      messages: visibleMessages(conversation.messages, current.userId).map(
        toMessage,
      ),
    };
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
        profilePhotoUrl: true,
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
      profilePhotoUrl: user.profilePhotoUrl,
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
    const current = requireActor(actor);
    const message = await this.repo.getMessage(messageId);
    if (!message) throw new NotFoundError("Message");
    if (message.isDeleted) {
      return { id: messageId, conversationId: message.conversationId };
    }

    // Admins may remove any message; rescuers only their own.
    if (current.role !== "admin") {
      if (message.senderUserId !== current.userId) {
        throw new ForbiddenError(
          "You can only delete your own messages for everyone",
        );
      }
      await this.assertParticipant(message.conversationId, current.userId);
    }

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

  /** Hides a message only for the requesting participant. */
  async deleteMessageForMe(messageId: string, actor?: Actor) {
    const current = requireActor(actor);
    const message = await this.repo.getMessage(messageId);
    if (!message) throw new NotFoundError("Message");
    // Admins moderate threads they are not part of; the hide still only
    // applies to their own console view.
    if (current.role !== "admin") {
      await this.assertParticipant(message.conversationId, current.userId);
    }
    await this.repo.hideMessageForUser(messageId, current.userId);
    return { id: messageId, conversationId: message.conversationId };
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.repo.getById(conversationId);
    const isParticipant = conversation.participants.some(
      (participant) => participant.userId === userId,
    );
    if (!isParticipant) throw new NotFoundError("Message");
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
      profilePhotoUrl: user.profilePhotoUrl,
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

  unreadForUser(userId: string) {
    return this.repo.unreadForUser(userId);
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
