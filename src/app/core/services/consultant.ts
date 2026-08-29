import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Consultant,
  ConsultantProfile
} from '../models/consultant';

@Injectable({
  providedIn: 'root'
})
export class ConsultantService {
  private readonly apiUrl =
    'http://localhost:8080/api/consultants';

  constructor(
    private readonly http: HttpClient
  ) {}

  getProfile(): Observable<Consultant> {
    return this.http.get<Consultant>(
      `${this.apiUrl}/me`
    );
  }

  updateProfile(
    consultant: Consultant
  ): Observable<Consultant> {
    return this.http.put<Consultant>(
      `${this.apiUrl}/me`,
      consultant
    );
  }

  uploadCv(file: File): Observable<Consultant> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Consultant>(
      `${this.apiUrl}/me/cv`,
      formData
    );
  }

  uploadProfileImage(
    file: File
  ): Observable<Consultant> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Consultant>(
      `${this.apiUrl}/me/profile-image`,
      formData
    );
  }

  deleteProfileImage(): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/me/profile-image`
    );
  }

  getProfileImage(
    consultantId: string
  ): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${consultantId}/profile-image`,
      {
        responseType: 'blob'
      }
    );
  }

  getAllConsultants(): Observable<Consultant[]> {
    return this.http.get<Consultant[]>(
      this.apiUrl
    );
  }

  analyzeMyCv(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/me/analyze-cv`,
      {},
      {
        responseType: 'text'
      }
    );
  }

  previewCvAnalysis(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/me/analyze-cv-preview`,
      {}
    );
  }

  getConsultantById(
    consultantId: string
  ): Observable<ConsultantProfile> {
    return this.http.get<ConsultantProfile>(
      `${this.apiUrl}/${consultantId}`
    );
  }

  downloadConsultantCv(
    consultantId: string
  ): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${consultantId}/cv`,
      {
        responseType: 'blob'
      }
    );
  }
}