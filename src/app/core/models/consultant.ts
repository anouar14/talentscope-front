export interface Consultant {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title: string;
  skills: string[];
  cvUrl: string;
  profileImageUrl: string | null;
  experienceYears: number;
  location: string;
  available: boolean;
}

export interface ConsultantProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  skills: string[];
  experienceYears: number;
  location: string;
  available: boolean;
  cvAvailable: boolean;
  profileImageUrl: string | null;
}