export type MissionStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Mission {
  id: string;
  invitationId: string;

  companyId: string;
  companyName: string;

  consultantId: string;
  consultantName: string;
  consultantTitle: string;

  title: string;
  description: string;

  status: MissionStatus;

  createdAt: string;
  updatedAt: string;
}