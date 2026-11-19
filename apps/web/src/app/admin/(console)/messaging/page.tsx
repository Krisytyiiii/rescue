import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  authService,
  messagingService,
  type Actor,
} from "@furescue/core";

import { AdminSupabaseRealtime } from "@/components/admin/supabase-realtime";
import { MessagingConsole } from "@/components/admin/messaging/messaging-console";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Messaging — FuRescue admin",
  robots: { index: false, follow: false },
};

export default async function AdminMessagingPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const session = await readSession();
  if (!session || session.role !== "admin") redirect("/admin/login");

  const admin = await authService.me(session.sub);
  const actor: Actor = {
    userId: admin.id,
    role: admin.role,
    barangayId: admin.barangayId,
  };

  const [conversations, counts, params] = await Promise.all([
    fetchAllPages((page, pageSize) =>
      messagingService.list({ page, pageSize, context: "general" }, actor),
    ),
    messagingService.getCounts(actor),
    searchParams,
  ]);

  // Direct messages only: threads with a subject are system/context threads.
  const directConversations = conversations.filter(
    (conversation) => !conversation.subject,
  );

  return (
    <div className="w-full">
      <AdminSupabaseRealtime
        channelName="admin-realtime"
        tables={["conversations", "messages", "conversation_participants"]}
      />

      <MessagingConsole
        conversations={directConversations}
        counts={counts}
        currentUserId={admin.id}
        initialConversationId={params.conversation ?? null}
      />
    </div>
  );
}
