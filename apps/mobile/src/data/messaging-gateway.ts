import { fetch as expoFetch } from "expo/fetch";

import type {
  ChatMessage,
  ChatPreview,
  ChatThread,
  ResidentContact,
} from "@/domain/messaging";
import type { SessionStorage } from "@/domain/ports";

import { API_BASE_URL } from "./config";
import { ApiError, requestJson } from "./http";

export interface DirectMessageInput {
  userId: string;
  body: string;
}

interface ConversationMessagePayload {
  id: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  body: string;
  sentAt: string;
  attachmentUrl: string | null;
  isDeleted?: boolean;
}

interface ConversationPayload {
  id: string;
  participants: {
    userId: string;
    fullName: string;
    profilePhotoUrl: string | null;
  }[];
  messages: ConversationMessagePayload[];
}

interface ThreadPreviewPayload {
  id: string;
  participants: {
    userId: string;
    fullName: string;
    profilePhotoUrl: string | null;
  }[];
  lastMessage: {
    senderUserId: string;
    body: string;
    sentAt: string;
  } | null;
  updatedAt: string;
  unreadCount: number;
}

/** Live thread updates pushed over server-sent events. */
export interface ThreadStreamHandlers {
  onThread(thread: ChatThread): void;
  /** Called once the stream is connected; polling can stand down. */
  onLive?(): void;
  /** Called when the stream ends or fails; polling should resume. */
  onDisconnect?(): void;
}

/** Port the messages list and chat room depend on. */
export interface MessagingDataSource {
  loadThread(contactUserId: string): Promise<ChatThread | null>;
  startThread(contactUserId: string, body: string): Promise<ChatThread>;
  sendReply(conversationId: string, body: string): Promise<ChatMessage>;
  /** Delete a message for the rescuer only, or for the whole thread. */
  deleteMessage(
    messageId: string,
    scope: "me" | "everyone",
  ): Promise<void>;
  /**
   * Live thread updates over server-sent events. Returns an unsubscribe
   * function. Optional so a failure simply falls back to polling.
   */
  subscribeThread?(
    contactUserId: string,
    handlers: ThreadStreamHandlers,
  ): () => void;
}

/** Port for the resident's chat contacts (City Vet team + assigned rescuers). */
export interface ResidentContactsDataSource {
  loadContacts(): Promise<ResidentContact[]>;
}

/** Port for the latest direct-thread activity per contact. */
export interface ChatPreviewDataSource {
  loadPreviews(): Promise<ChatPreview[]>;
}

/** Real backend implementation of direct messaging. */
export class HttpMessagingGateway
  implements
    MessagingDataSource,
    ResidentContactsDataSource,
    ChatPreviewDataSource
{
  constructor(private readonly session: SessionStorage) {}

  private async context(): Promise<{ token?: string; userId: string }> {
    const stored = await this.session.read();
    return { token: stored?.token, userId: stored?.user.id ?? "" };
  }

  private toMessage(
    message: ConversationMessagePayload,
    currentUserId: string,
  ): ChatMessage {
    return {
      id: message.id,
      body: message.body,
      sentAt: message.sentAt,
      mine: message.senderUserId === currentUserId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      attachmentUrl: message.attachmentUrl,
      isDeleted: message.isDeleted ?? false,
    };
  }

  private toThread(
    conversation: ConversationPayload,
    contactUserId: string,
    currentUserId: string,
  ): ChatThread {
    const contact = conversation.participants.find(
      (participant) => participant.userId === contactUserId,
    );

    return {
      id: conversation.id,
      contactUserId,
      contactName: contact?.fullName ?? "Contact",
      contactPhotoUrl: contact?.profilePhotoUrl ?? null,
      messages: conversation.messages.map((message) =>
        this.toMessage(message, currentUserId),
      ),
    };
  }

  async loadThread(contactUserId: string): Promise<ChatThread | null> {
    const { token, userId } = await this.context();
    let conversation: ConversationPayload | null;
    try {
      conversation = await requestJson<ConversationPayload | null>(
        `/api/messages/direct?userId=${encodeURIComponent(contactUserId)}`,
        {
          token,
          networkMessage: "Can't reach FuRescue. Check your connection.",
          fallbackMessage: "We couldn't load this chat.",
        },
      );
    } catch (error) {
      // Older backends don't expose the GET handler yet. Treat that as an
      // empty thread instead of an error; sending still loads the history.
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405)
      ) {
        return null;
      }
      throw error;
    }
    return conversation ? this.toThread(conversation, contactUserId, userId) : null;
  }

  /** People a resident may message: the City Vet team and assigned rescuers. */
  async loadContacts(): Promise<ResidentContact[]> {
    const { token } = await this.context();
    const payload = await requestJson<{ contacts: ResidentContact[] }>(
      "/api/messages/contacts",
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load your contacts.",
      },
    );
    return payload.contacts;
  }

  /** Latest message per direct thread, newest activity first. */
  async loadPreviews(): Promise<ChatPreview[]> {
    const { token, userId } = await this.context();
    const payload = await requestJson<{ threads: ThreadPreviewPayload[] }>(
      "/api/messages/threads",
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load your chats.",
      },
    );

    return payload.threads.flatMap((thread) => {
      const contact = thread.participants.find(
        (participant) => participant.userId !== userId,
      );
      if (!contact) return [];

      return [
        {
          contactUserId: contact.userId,
          lastMessage: thread.lastMessage?.body ?? null,
          lastMessageAt: thread.lastMessage?.sentAt ?? thread.updatedAt,
          lastMessageMine: thread.lastMessage?.senderUserId === userId,
          unreadCount: thread.unreadCount,
        },
      ];
    });
  }

  async startThread(contactUserId: string, body: string): Promise<ChatThread> {
    const { token, userId } = await this.context();
    const conversation = await requestJson<ConversationPayload>(
      "/api/messages/direct",
      {
        method: "POST",
        body: { userId: contactUserId, body },
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't send that message.",
      },
    );
    return this.toThread(conversation, contactUserId, userId);
  }

  async sendReply(conversationId: string, body: string): Promise<ChatMessage> {
    const { token, userId } = await this.context();
    const message = await requestJson<ConversationMessagePayload>(
      `/api/messages/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: { body },
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't send that message.",
      },
    );
    return this.toMessage(message, userId);
  }

  async deleteMessage(
    messageId: string,
    scope: "me" | "everyone",
  ): Promise<void> {
    const { token } = await this.context();
    await requestJson<{ id: string }>(
      `/api/messages/${encodeURIComponent(messageId)}?scope=${scope}`,
      {
        method: "DELETE",
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't delete that message.",
      },
    );
  }

  subscribeThread(
    contactUserId: string,
    handlers: ThreadStreamHandlers,
  ): () => void {
    const controller = new AbortController();
    void this.openThreadStream(contactUserId, handlers, controller.signal);
    return () => controller.abort();
  }

  /** Reads the SSE stream and maps each thread event to a domain thread. */
  private async openThreadStream(
    contactUserId: string,
    handlers: ThreadStreamHandlers,
    signal: AbortSignal,
  ): Promise<void> {
    const { token, userId } = await this.context();
    if (signal.aborted) return;

    let response: Awaited<ReturnType<typeof expoFetch>>;
    try {
      response = await expoFetch(
        `${API_BASE_URL}/api/messages/direct/stream?userId=${encodeURIComponent(contactUserId)}`,
        {
          headers: {
            accept: "text/event-stream",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          signal,
        },
      );
    } catch {
      if (!signal.aborted) handlers.onDisconnect?.();
      return;
    }

    if (!response.ok || !response.body) {
      handlers.onDisconnect?.();
      return;
    }

    handlers.onLive?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let event = "";
    let data: string[] = [];

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          let line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);

          if (line === "") {
            if (event === "thread" && data.length > 0) {
              try {
                const payload = JSON.parse(data.join("\n")) as
                  | ConversationPayload
                  | null;
                if (payload) {
                  handlers.onThread(this.toThread(payload, contactUserId, userId));
                }
              } catch {
                // Ignore a malformed frame; the next one will arrive.
              }
            }
            event = "";
            data = [];
          } else if (line.startsWith("event:")) {
            event = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data.push(line.slice(5).trimStart());
          }

          newline = buffer.indexOf("\n");
        }
      }
    } catch {
      // Aborted on unmount or a dropped connection; polling takes over.
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Reader may already be released.
      }
      if (!signal.aborted) handlers.onDisconnect?.();
    }
  }
}
