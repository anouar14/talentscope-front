import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Mission,
  MissionStatus
} from '../models/mission';

@Injectable({
  providedIn: 'root'
})
export class MissionService {

  private readonly apiUrl =
    'http://localhost:8080/api/missions';

  constructor(
    private readonly http: HttpClient
  ) {}

  getCompanyMissions(): Observable<Mission[]> {
    return this.http.get<Mission[]>(
      `${this.apiUrl}/company/me`
    );
  }

  getConsultantMissions(): Observable<Mission[]> {
    return this.http.get<Mission[]>(
      `${this.apiUrl}/consultant/me`
    );
  }

  getMissionById(
    missionId: string
  ): Observable<Mission> {
    return this.http.get<Mission>(
      `${this.apiUrl}/${missionId}`
    );
  }

  updateMissionStatus(
    missionId: string,
    status: MissionStatus
  ): Observable<Mission> {
    return this.http.put<Mission>(
      `${this.apiUrl}/${missionId}/status`,
      {
        status
      }
    );
  }
}