import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../models/company';

export interface ConsultantMatchResult {
  consultantId: string;
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  experienceYears: number;
  available: boolean;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
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
  private readonly apiUrl =
    'http://localhost:8080/api/companies';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Company> {
    return this.http.get<Company>(
      `${this.apiUrl}/me`
    );
  }

  updateProfile(
    company: Company
  ): Observable<Company> {
    return this.http.put<Company>(
      `${this.apiUrl}/me`,
      company
    );
  }

  matchConsultants(
    jobDescription: string
  ): Observable<MatchingResponse> {
    return this.http.post<MatchingResponse>(
      `${this.apiUrl}/matching`,
      {
        jobDescription
      }
    );
  }
}