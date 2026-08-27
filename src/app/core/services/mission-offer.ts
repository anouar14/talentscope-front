import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateMissionOfferRequest,
  MissionOffer
} from '../models/mission-offer';

@Injectable({
  providedIn: 'root'
})
export class MissionOfferService {

  private readonly apiUrl =
    'http://localhost:8080/api/mission-offers';

  constructor(
    private readonly http: HttpClient
  ) {}

  createOffer(
    request: CreateMissionOfferRequest
  ): Observable<MissionOffer> {
    return this.http.post<MissionOffer>(
      this.apiUrl,
      request
    );
  }

  getOpenOffers(): Observable<MissionOffer[]> {
    return this.http.get<MissionOffer[]>(
      this.apiUrl
    );
  }

  getCompanyOffers(): Observable<MissionOffer[]> {
    return this.http.get<MissionOffer[]>(
      `${this.apiUrl}/company`
    );
  }

  getOfferById(
    offerId: string
  ): Observable<MissionOffer> {
    return this.http.get<MissionOffer>(
      `${this.apiUrl}/${offerId}`
    );
  }

  closeOffer(
    offerId: string
  ): Observable<MissionOffer> {
    return this.http.put<MissionOffer>(
      `${this.apiUrl}/${offerId}/close`,
      {}
    );
  }
}