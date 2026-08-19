import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Auth,
  GoogleAuthResponse,
  UserRole
} from '../../../core/services/auth';

declare const google: any;

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements AfterViewInit {
  @ViewChild('googleButton')
  googleButton!: ElementRef<HTMLDivElement>;

  email = '';
  password = '';

  loading = false;
  googleLoading = false;
  errorMessage = '';

  private googleInitializationAttempts = 0;

  private readonly googleClientId =
    '886453448314-rs9i84084cvapuauu33kq3dmu5drq66k.apps.googleusercontent.com';

  constructor(
    private readonly authService: Auth,
    private readonly router: Router,
    private readonly ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.initializeGoogleButton();
  }

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.email.trim().toLowerCase(),
      password: this.password
    }).subscribe({
      next: response => {
        this.authService.saveAuth(response);
        this.loading = false;
        this.redirectByRole(response.role);
      },
      error: (error: HttpErrorResponse) => {
        console.error(error);

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Ce compte a été désactivé. Contactez un administrateur.';
          return;
        }

        this.errorMessage =
          'Email ou mot de passe incorrect.';
      }
    });
  }

  private initializeGoogleButton(): void {
    if (
      typeof google === 'undefined' ||
      !google.accounts?.id
    ) {
      this.googleInitializationAttempts++;

      if (this.googleInitializationAttempts <= 20) {
        setTimeout(
          () => this.initializeGoogleButton(),
          250
        );
      } else {
        this.ngZone.run(() => {
          this.errorMessage =
            'Le service de connexion Google est indisponible.';
        });
      }

      return;
    }

    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (
        response: GoogleCredentialResponse
      ) => {
        this.ngZone.run(() => {
          this.handleGoogleCredential(response);
        });
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    google.accounts.id.renderButton(
      this.googleButton.nativeElement,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 396,
        locale: 'fr'
      }
    );
  }

  private handleGoogleCredential(
    response: GoogleCredentialResponse
  ): void {
    this.errorMessage = '';

    if (!response.credential) {
      this.errorMessage =
        'Google n’a pas retourné de jeton valide.';
      return;
    }

    this.googleLoading = true;

    this.authService
      .googleLogin(response.credential)
      .subscribe({
        next: googleResponse => {
          this.googleLoading = false;

          if (googleResponse.requiresRole) {
            sessionStorage.setItem(
              'googleCredential',
              response.credential
            );

            sessionStorage.setItem(
              'googleUserEmail',
              googleResponse.email
            );

            sessionStorage.setItem(
              'googleUserName',
              googleResponse.name
            );

            this.router.navigate([
              '/google-role-selection'
            ]);

            return;
          }

          this.completeGoogleLogin(
            googleResponse
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(error);

          this.googleLoading = false;

          if (error.status === 401) {
            this.errorMessage =
              'La connexion Google est invalide ou a expiré.';
            return;
          }

          if (error.status === 403) {
            this.errorMessage =
              'Ce compte a été désactivé. Contactez un administrateur.';
            return;
          }

          if (error.status === 409) {
            this.errorMessage =
              'Cette adresse est déjà associée à un autre compte.';
            return;
          }

          this.errorMessage =
            'Impossible de se connecter avec Google.';
        }
      });
  }

  private completeGoogleLogin(
    response: GoogleAuthResponse
  ): void {
    try {
      this.authService.saveGoogleAuth(response);

      sessionStorage.removeItem(
        'googleCredential'
      );
      sessionStorage.removeItem(
        'googleUserEmail'
      );
      sessionStorage.removeItem(
        'googleUserName'
      );

      this.redirectByRole(response.role);
    } catch (error) {
      console.error(error);

      this.errorMessage =
        'La réponse du serveur est incomplète.';
    }
  }

  private redirectByRole(
    role: UserRole | null
  ): void {
    if (role === 'ADMIN') {
      this.router.navigate([
        '/admin/dashboard'
      ]);
      return;
    }

    if (role === 'CONSULTANT') {
      this.router.navigate([
        '/consultant/dashboard'
      ]);
      return;
    }

    if (role === 'COMPANY') {
      this.router.navigate([
        '/company/dashboard'
      ]);
      return;
    }

    this.authService.logout();
    this.router.navigate(['/']);
  }
}