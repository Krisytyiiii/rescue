/** One message inside a rescuer's direct chat. */
export interface ChatMessage {
  id: string;
  body: string;
  sentAt: string;
  /** True when the signed-in rescuer sent it. */
  mine: boolean;
  senderName: string;
  senderRole: string;
  attachmentUrl: string | null;
  /** Set on optimistic messages the app is still delivering. */
  status?: "sending";
  /** True when the message was deleted for everyone. */
  isDeleted?: boolean;
}

/** A resident's direct-chat contact (City Vet team member or assigned rescuer). */
export interface ResidentContact {
  userId: string;
  fullName: string;
  role: "admin" | "rescuer";
  profilePhotoUrl: string | null;
  /** Report codes that link this person to the resident's reports. */
  reportCodes: string[];
}

/** Latest activity with one contact, used to preview the chat list. */
export interface ChatPreview {
  contactUserId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  /** True when the signed-in person sent the last message. */
  lastMessageMine: boolean;
  unreadCount: number;
}

/** A rescuer's direct conversation with one dispatcher or reporter. */
export interface ChatThread {
  id: string;
  contactUserId: string;
  contactName: string;
  /** Avatar of the other person, or null when they have not attached one. */
  contactPhotoUrl: string | null;
  messages: ChatMessage[];
}
