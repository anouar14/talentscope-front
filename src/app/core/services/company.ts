import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '../models/company';

export interface ScoreBreakdown {
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  titleScore: number;
  locationScore: number;
  aiScore: number;
}

export interface ConsultantMatchResult {
  consultantId: string;
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  experienceYears: number;
  available: boolean;
  score: number;
  confidence: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
}

export interface MatchingResponse {
  jobDescription: string;
  analyzedConsultants: number;
  results: ConsultantMatchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly apiUrl = 'http://localhost:8080/api/companies';

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/me`);
  }

  updateProfile(company: Company): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/me`, company);
  }

  matchConsultants(jobDescription: string): Observable<MatchingResponse> {
    return this.http.post<MatchingResponse>(
      `${this.apiUrl}/matching`,
      { jobDescription }
    );
  }
}