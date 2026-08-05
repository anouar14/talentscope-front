import { ContractType, WorkMode } from './invitation';

export type MissionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

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

  startDate: string | null;
  endDate: string | null;

  contractType: ContractType | null;
  workMode: WorkMode | null;

  location: string | null;
  salary: number | null;

  technologies: string[];
  notes: string | null;

  status: MissionStatus;

  createdAt: string;
  updatedAt: string;
}