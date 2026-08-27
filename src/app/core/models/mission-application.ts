import { MissionApplicationStatus } from './mission-offer';

export interface MissionApplication {
  id: string;

  missionOfferId: string;
  missionTitle: string;

  companyId: string;
  companyName: string;

  consultantId: string;
  consultantName: string;
  consultantTitle: string;
  consultantExperienceYears: number;
  consultantLocation: string | null;

  message: string | null;

  status: MissionApplicationStatus;

  appliedAt: string;
  respondedAt: string | null;
}

export interface CreateMissionApplicationRequest {
  message: string | null;
}