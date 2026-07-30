export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Invitation {
  id: string;
  companyId: string;
  companyName: string;
  consultantId: string;
  consultantName: string;
  consultantTitle: string;
  subject: string;
  message: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateInvitationRequest {
  consultantId: string;
  subject: string;
  message: string;
}

export interface InvitationResponseRequest {
  accepted: boolean;
}