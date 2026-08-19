import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type UserRole =
  | 'CONSULTANT'
  | 'COMPANY'
  | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'CONSULTANT' | 'COMPANY';
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: UserRole;
  email: string;
  userId: string;
}

export interface MessageResponse {
  message: string;
}

export interface TokenValidationResponse {
  valid: boolean;
}

export interface GoogleAuthResponse {
  requiresRole: boolean;
  token: string | null;
  role: UserRole | null;
  email: string;
  userId: string | null;
  name: string;
}

export interface GoogleCompleteRegistrationRequest {
  credential: string;
  role: 'CONSULTANT' | 'COMPANY';
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  constructor(private readonly http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      data
    );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  validateResetToken(
    token: string
  ): Observable<TokenValidationResponse> {
    return this.http.get<TokenValidationResponse>(
      `${this.apiUrl}/reset-password/validate`,
      {
        params: { token }
      }
    );
  }

  resetPassword(
    token: string,
    newPassword: string
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiUrl}/reset-password`,
      {
        token,
        newPassword
      }
    );
  }

  saveAuth(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
    localStorage.setItem('email', response.email);
    localStorage.setItem('userId', response.userId);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): UserRole | null {
    const role = localStorage.getItem('role');

    if (
      role === 'CONSULTANT' ||
      role === 'COMPANY' ||
      role === 'ADMIN'
    ) {
      return role;
    }

    return null;
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
  }

  googleLogin(
    credential: string
  ): Observable<GoogleAuthResponse> {
    return this.http.post<GoogleAuthResponse>(
      `${this.apiUrl}/google`,
      { credential }
    );
  }

  completeGoogleRegistration(
    request: GoogleCompleteRegistrationRequest
  ): Observable<GoogleAuthResponse> {
    return this.http.post<GoogleAuthResponse>(
      `${this.apiUrl}/google/complete-registration`,
      request
    );
  }

  saveGoogleAuth(response: GoogleAuthResponse): void {
    if (
      !response.token ||
      !response.role ||
      !response.userId
    ) {
      throw new Error(
        'La réponse Google ne contient pas les données d’authentification.'
      );
    }

    this.saveAuth({
      token: response.token,
      role: response.role,
      email: response.email,
      userId: response.userId
    });
  }
}