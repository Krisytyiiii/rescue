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

/** A rescuer's direct conversation with one dispatcher or reporter. */
export interface ChatThread {
  id: string;
  contactUserId: string;
  contactName: string;
  /** Avatar of the other person, or null when they have not attached one. */
  contactPhotoUrl: string | null;
  messages: ChatMessage[];
}
