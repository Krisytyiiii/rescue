import type { Prisma } from "../../generated/prisma/client.ts";

export const conversationStatusValues = ["open", "closed"] as const;
export const conversationContextValues = ["report", "adoption_request", "general"] as const;

export type ConversationStatusValue = (typeof conversationStatusValues)[number];
export type ConversationContextValue = (typeof conversationContextValues)[number];

const participantUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  profilePhotoUrl: true,
  role: { select: { roleName: true } },
} as const;

const senderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  profilePhotoUrl: true,
  role: { select: { roleName: true } },
} as const;

const assigneeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export const conversationInclude = {
  assignee: { select: assigneeSelect },
  participants: {
    include: { user: { select: participantUserSelect } },
  },
  messages: {
    where: { isDeleted: false },
    orderBy: { sentAt: "desc" as const },
    take: 1,
    include: { sender: { select: senderSelect } },
  },
  _count: { select: { messages: true } },
} satisfies Prisma.ConversationInclude;

export const conversationDetailInclude = {
  ...conversationInclude,
  messages: {
    orderBy: { sentAt: "asc" as const },
    include: {
      sender: { select: senderSelect },
      deletions: { select: { userId: true } },
    },
  },
} satisfies Prisma.ConversationInclude;

export type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

export type ConversationDetailWithRelations = Prisma.ConversationGetPayload<{
  include: typeof conversationDetailInclude;
}>;

export const notificationInclude = {
  recipient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: { select: { roleName: true } },
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

export interface ListMessagingQuery {
  page?: number;
  pageSize?: number;
  status?: ConversationStatusValue | "all";
  context?: ConversationContextValue | "all";
  q?: string;
}

export interface ListMessagingNotificationsQuery {
  page?: number;
  pageSize?: number;
  type?: string;
  read?: "all" | "read" | "unread";
  q?: string;
}

export interface MessagingParticipantRow {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profilePhotoUrl: string | null;
  role: string;
  lastReadAt: string | null;
}

export interface MessagingAssigneeRow {
  userId: string;
  fullName: string;
}

export interface MessagingMessageRow {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderProfilePhotoUrl: string | null;
  senderRole: string;
  body: string;
  attachmentUrl: string | null;
  sentAt: string;
  isDeleted: boolean;
}

export interface MessagingContextRow {
  kind: ConversationContextValue;
  code: string | null;
  title: string;
  subtitle: string | null;
  href: string | null;
}

export interface ConversationListRow {
  id: string;
  contextType: ConversationContextValue;
  contextId: string | null;
  subject: string | null;
  status: ConversationStatusValue;
  createdAt: string;
  updatedAt: string;
  assignee: MessagingAssigneeRow | null;
  participants: MessagingParticipantRow[];
  lastMessage: MessagingMessageRow | null;
  messageCount: number;
  unreadCount: number;
  needsReply: boolean;
  context: MessagingContextRow;
}

export interface ConversationDetailRow extends ConversationListRow {
  messages: MessagingMessageRow[];
}

export interface MessagingCounts {
  open: number;
  closed: number;
  needsReply: number;
  unread: number;
  total: number;
}

export interface MessagingNotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  recipientUserId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  channel: string;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  referenceType: string | null;
  referenceId: string | null;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  read: number;
}

export interface ParticipantCandidateRow {
  userId: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  role: string;
}
