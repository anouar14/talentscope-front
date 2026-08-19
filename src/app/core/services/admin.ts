import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminCompany,
  AdminConsultant,
  AdminDashboard,
  AdminInvitation,
  AdminInvitationStatus,
  AdminMission,
  AdminMissionStatus,
  AdminUser,
  AdminUserRole,
  UpdateAdminUserStatusRequest
} from '../models/admin';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:8080/api/admin';

  constructor(private readonly http: HttpClient) {}

  getDashboardStatistics(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(
      `${this.apiUrl}/dashboard`
    );
  }

  getUsers(
    search = '',
    role: AdminUserRole | null = null
  ): Observable<AdminUser[]> {
    let params = new HttpParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<AdminUser[]>(
      `${this.apiUrl}/users`,
      { params }
    );
  }

  getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(
      `${this.apiUrl}/users/${userId}`
    );
  }

  updateUserStatus(
    userId: string,
    enabled: boolean
  ): Observable<AdminUser> {
    const request: UpdateAdminUserStatusRequest = {
      enabled
    };

    return this.http.patch<AdminUser>(
      `${this.apiUrl}/users/${userId}/status`,
      request
    );
  }

  getConsultants(search = ''): Observable<AdminConsultant[]> {
    let params = new HttpParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    return this.http.get<AdminConsultant[]>(
      `${this.apiUrl}/consultants`,
      { params }
    );
  }

  getCompanies(search = ''): Observable<AdminCompany[]> {
    let params = new HttpParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    return this.http.get<AdminCompany[]>(
      `${this.apiUrl}/companies`,
      { params }
    );
  }

  getInvitations(
    search = '',
    status: AdminInvitationStatus | null = null
  ): Observable<AdminInvitation[]> {
    let params = new HttpParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<AdminInvitation[]>(
      `${this.apiUrl}/invitations`,
      { params }
    );
  }

  getMissions(
    search = '',
    status: AdminMissionStatus | null = null
  ): Observable<AdminMission[]> {
    let params = new HttpParams();

    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      params = params.set('search', normalizedSearch);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<AdminMission[]>(
      `${this.apiUrl}/missions`,
      { params }
    );
  }
}