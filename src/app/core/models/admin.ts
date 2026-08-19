export type AdminUserRole =
  | 'CONSULTANT'
  | 'COMPANY'
  | 'ADMIN';

export type AdminAuthProvider =
  | 'LOCAL'
  | 'GOOGLE';

export type AdminInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export type AdminMissionStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AdminDashboard {
  totalUsers: number;

  totalConsultants: number;
  availableConsultants: number;
  totalCompanies: number;

  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  rejectedInvitations: number;

  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  cancelledMissions: number;
}

export interface AdminUser {
  id: string;
  email: string;

  role: AdminUserRole;
  authProvider: AdminAuthProvider;

  profileId: string | null;
  displayName: string;
  professionalTitle: string | null;

  enabled: boolean;
}

export interface AdminConsultant {
  id: string;
  userId: string;
  email: string;

  firstName: string | null;
  lastName: string | null;
  title: string | null;

  skills: string[];

  experienceYears: number;
  location: string | null;

  available: boolean;
  cvAvailable: boolean;
  enabled: boolean;
}

export interface AdminCompany {
  id: string;
  userId: string;
  email: string;

  companyName: string | null;
  sector: string | null;
  location: string | null;
  website: string | null;
  description: string | null;

  enabled: boolean;
}

export interface AdminInvitation {
  id: string;

  companyId: string;
  companyName: string;

  consultantId: string;
  consultantName: string;
  consultantTitle: string;

  subject: string;
  message: string;

  startDate: string;
  endDate: string | null;

  contractType: string | null;
  workMode: string | null;

  location: string | null;
  salary: number | null;

  technologies: string[];
  notes: string | null;

  status: AdminInvitationStatus;

  createdAt: string;
  respondedAt: string | null;
}

export interface AdminMission {
  id: string;
  invitationId: string;

  companyId: string;
  companyName: string;

  consultantId: string;
  consultantName: string;
  consultantTitle: string;

  title: string;
  description: string;

  startDate: string;
  endDate: string | null;

  contractType: string | null;
  workMode: string | null;

  location: string | null;
  salary: number | null;

  technologies: string[];
  notes: string | null;

  status: AdminMissionStatus;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminUserStatusRequest {
  enabled: boolean;
}