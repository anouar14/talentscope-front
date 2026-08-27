import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateMissionApplicationRequest,
  MissionApplication
} from '../models/mission-application';

@Injectable({
  providedIn: 'root'
})
export class MissionApplicationService {

  private readonly apiUrl =
    'http://localhost:8080/api/mission-applications';

  constructor(
    private readonly http: HttpClient
  ) {}

  apply(
    offerId: string,
    request: CreateMissionApplicationRequest
  ): Observable<MissionApplication> {
    return this.http.post<MissionApplication>(
      `${this.apiUrl}/offers/${offerId}`,
      request
    );
  }

  getConsultantApplications(): Observable<MissionApplication[]> {
    return this.http.get<MissionApplication[]>(
      `${this.apiUrl}/consultant`
    );
  }

  getOfferApplications(
    offerId: string
  ): Observable<MissionApplication[]> {
    return this.http.get<MissionApplication[]>(
      `${this.apiUrl}/offers/${offerId}`
    );
  }

  acceptApplication(
    applicationId: string
  ): Observable<MissionApplication> {
    return this.http.put<MissionApplication>(
      `${this.apiUrl}/${applicationId}/accept`,
      {}
    );
  }

  rejectApplication(
    applicationId: string
  ): Observable<MissionApplication> {
    return this.http.put<MissionApplication>(
      `${this.apiUrl}/${applicationId}/reject`,
      {}
    );
  }
}