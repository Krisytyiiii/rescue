import type { NotificationChannel, NotificationType } from "../../generated/prisma/enums.ts";

export interface CreateNotificationInput {
  recipientUserId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  channel?: NotificationChannel;
}

export interface ListNotificationsQuery {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}
