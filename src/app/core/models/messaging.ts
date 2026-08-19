export interface Conversation {
  id: string;

  companyId: string;
  consultantId: string;

  participantName: string;
  participantTitle: string;

  lastMessage: string | null;
  lastMessageAt: string | null;

  unreadCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;

  conversationId: string;
  senderUserId: string;

  sentByMe: boolean;

  content: string;

  read: boolean;

  sentAt: string;
  readAt: string | null;
}

export interface SendMessageRequest {
  content: string;
}

export interface UnreadMessageCountResponse {
  unreadCount: number;
}