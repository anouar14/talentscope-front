import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit
} from '@angular/core';
import {
  FormsModule,
  NgForm
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  token = '';

  newPassword = '';
  confirmPassword = '';

  loading = false;
  validatingToken = true;
  tokenValid = false;
  submitted = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: Auth,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token =
      this.activatedRoute.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.validatingToken = false;
      this.tokenValid = false;
      this.errorMessage =
        'Le lien de réinitialisation est incomplet.';
      return;
    }

    this.validateToken();
  }

  get passwordsDoNotMatch(): boolean {
    return (
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword
    );
  }

  private validateToken(): void {
    this.validatingToken = true;

    this.authService
      .validateResetToken(this.token)
      .subscribe({
        next: (response) => {
          this.validatingToken = false;
          this.tokenValid = response.valid;

          if (!response.valid) {
            this.errorMessage =
              'Ce lien de réinitialisation est invalide ou a expiré.';
          }
        },

        error: () => {
          this.validatingToken = false;
          this.tokenValid = false;
          this.errorMessage =
            'Impossible de vérifier le lien de réinitialisation.';
        }
      });
  }

  onResetPassword(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.tokenValid) {
      this.errorMessage =
        'Le lien de réinitialisation est invalide.';
      return;
    }

    if (form.invalid) {
      this.errorMessage =
        'Veuillez corriger les champs invalides.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage =
        'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;

    this.authService
      .resetPassword(
        this.token,
        this.newPassword
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message;
          this.tokenValid = false;

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },

        error: (error: HttpErrorResponse) => {
          this.loading = false;

          if (error.status === 400) {
            this.tokenValid = false;
            this.errorMessage =
              'Le lien est invalide, expiré ou le mot de passe ne respecte pas les règles.';
            return;
          }

          this.errorMessage =
            'Impossible de modifier le mot de passe.';
        }
      });
  }
}