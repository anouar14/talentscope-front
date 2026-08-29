export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export type ContractType =
  | 'CDI'
  | 'CDD'
  | 'FREELANCE'
  | 'INTERNSHIP'
  | 'OTHER';

export type WorkMode =
  | 'ONSITE'
  | 'REMOTE'
  | 'HYBRID';

export interface Invitation {
  id: string;

  companyId: string;
  companyName: string;

  consultantId: string;
  consultantName: string;
  consultantTitle: string;

  missionOfferId: string | null;

  subject: string;
  message: string;

  startDate: string | null;
  endDate: string | null;

  contractType: ContractType | null;
  workMode: WorkMode | null;

  location: string | null;
  salary: number | null;

  technologies: string[];

  notes: string | null;

  status: InvitationStatus;

  createdAt: string;
  respondedAt: string | null;
}

export interface CreateInvitationRequest {
  consultantId: string;

  missionOfferId: string | null;

  subject: string;
  message: string;

  startDate: string;
  endDate: string | null;

  contractType: ContractType;
  workMode: WorkMode;

  location: string;
  salary: number | null;

  technologies: string[];

  notes: string | null;
}

export interface InvitationResponseRequest {
  accepted: boolean;
}