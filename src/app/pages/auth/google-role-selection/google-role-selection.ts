import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, GoogleAuthResponse } from '../../../core/services/auth';

@Component({
  selector: 'app-google-role-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-role-selection.html',
  styleUrl: './google-role-selection.css'
})
export class GoogleRoleSelection implements OnInit {
  selectedRole: 'CONSULTANT' | 'COMPANY' | null = null;

  googleCredential = '';
  googleUserName = '';
  googleUserEmail = '';

  loading = false;
  errorMessage = '';

  constructor(
    private readonly authService: Auth,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.googleCredential =
      sessionStorage.getItem('googleCredential') ?? '';

    this.googleUserName =
      sessionStorage.getItem('googleUserName') ?? '';

    this.googleUserEmail =
      sessionStorage.getItem('googleUserEmail') ?? '';

    if (!this.googleCredential) {
      this.router.navigate(['/login']);
    }
  }

  selectRole(role: 'CONSULTANT' | 'COMPANY'): void {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  completeRegistration(): void {
    this.errorMessage = '';

    if (!this.googleCredential) {
      this.errorMessage =
        'La session Google a expiré. Recommencez la connexion.';
      return;
    }

    if (!this.selectedRole) {
      this.errorMessage =
        'Veuillez choisir un type de compte.';
      return;
    }

    this.loading = true;

    this.authService
      .completeGoogleRegistration({
        credential: this.googleCredential,
        role: this.selectedRole
      })
      .subscribe({
        next: response => {
          this.loading = false;
          this.finishAuthentication(response);
        },
        error: (error: HttpErrorResponse) => {
          console.error(error);

          this.loading = false;

          if (error.status === 401) {
            this.clearGoogleSession();

            this.errorMessage =
              'La session Google a expiré. Reconnectez-vous.';
            return;
          }

          if (error.status === 409) {
            this.errorMessage =
              'Cette adresse est déjà associée à un autre compte.';
            return;
          }

          this.errorMessage =
            'Impossible de finaliser votre inscription.';
        }
      });
  }

  cancel(): void {
    this.clearGoogleSession();
    this.router.navigate(['/login']);
  }

  private finishAuthentication(response: GoogleAuthResponse): void {
    try {
      this.authService.saveGoogleAuth(response);
      this.clearGoogleSession();

      if (response.role === 'CONSULTANT') {
        this.router.navigate(['/consultant/dashboard']);
        return;
      }

      if (response.role === 'COMPANY') {
        this.router.navigate(['/company/dashboard']);
        return;
      }

      this.router.navigate(['/']);
    } catch (error) {
      console.error(error);

      this.errorMessage =
        'La réponse du serveur est incomplète.';
    }
  }

  private clearGoogleSession(): void {
    sessionStorage.removeItem('googleCredential');
    sessionStorage.removeItem('googleUserName');
    sessionStorage.removeItem('googleUserEmail');
  }
}