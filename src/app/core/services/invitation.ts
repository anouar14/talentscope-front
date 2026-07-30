import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateInvitationRequest,
  Invitation,
  InvitationResponseRequest
} from '../models/invitation';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly apiUrl = 'http://localhost:8080/api/invitations';

  constructor(private readonly http: HttpClient) {}

  createInvitation(request: CreateInvitationRequest): Observable<Invitation> {
    return this.http.post<Invitation>(this.apiUrl, request);
  }

  getCompanyInvitations(): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${this.apiUrl}/company`);
  }

  getConsultantInvitations(): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${this.apiUrl}/consultant`);
  }

  respondToInvitation(invitationId: string, accepted: boolean): Observable<Invitation> {
    const request: InvitationResponseRequest = { accepted };

    return this.http.put<Invitation>(
      `${this.apiUrl}/${invitationId}/response`,
      request
    );
  }
}