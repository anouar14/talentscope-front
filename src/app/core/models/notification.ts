export type NotificationType =
  | 'INVITATION_RECEIVED'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REJECTED'
  | 'INVITATION_CLOSED'
  | 'MISSION_CREATED'
  | 'MISSION_COMPLETED'
  | 'MISSION_CANCELLED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadNotificationCountResponse {
  count: number;
}