export interface Company {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  location: string;
  website: string;
  description: string;
  profileImageUrl: string | null;
}