import { z } from "zod";

import {
  conversationContextValues,
  conversationStatusValues,
} from "./messaging.types.ts";

export const listMessagingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([...conversationStatusValues, "all"]).optional(),
  context: z.enum([...conversationContextValues, "all"]).optional(),
  q: z.string().trim().max(120).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message before sending").max(5_000),
  attachmentUrl: z.string().url().max(255).optional(),
});

export const startConversationSchema = z.object({
  userId: z.string().uuid("Choose a person to message"),
  body: z.string().trim().min(1, "Write a message before sending").max(5_000),
});

export const conversationStatusSchema = z.object({
  status: z.enum(conversationStatusValues),
});

export const assignConversationSchema = z.object({
  userId: z.string().uuid().nullable(),
});

export const addParticipantSchema = z.object({
  userId: z.string().uuid(),
});

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().trim().max(40).optional(),
  read: z.enum(["all", "read", "unread"]).optional(),
  q: z.string().trim().max(120).optional(),
});
