import { ContractType, WorkMode } from './invitation';

export type MissionOfferStatus = 'OPEN' | 'CLOSED' | 'FILLED';

export interface MissionOffer {
  id: string;

  companyId: string;
  companyName: string;

  title: string;
  description: string;

  startDate: string | null;
  endDate: string | null;

  contractType: ContractType | null;
  workMode: WorkMode | null;

  location: string | null;
  salary: number | null;

  minimumExperienceYears: number | null;

  technologies: string[];
  notes: string | null;

  status: MissionOfferStatus;

  applied: boolean;
  applicationStatus: MissionApplicationStatus | null;
  applicationCount: number;

  createdAt: string;
  updatedAt: string;
}

export type MissionApplicationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CreateMissionOfferRequest {
  title: string;
  description: string;

  startDate: string;
  endDate: string | null;

  contractType: ContractType;
  workMode: WorkMode;

  location: string;
  salary: number | null;

  minimumExperienceYears: number | null;

  technologies: string[];
  notes: string | null;
}