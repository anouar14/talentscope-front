import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  email = '';

  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: Auth) {}

  onSubmit(form: NgForm): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (form.invalid) {
      this.errorMessage =
        'Veuillez saisir une adresse email valide.';
      return;
    }

    this.loading = true;

    const normalizedEmail = this.email
      .trim()
      .toLowerCase();

    this.authService
      .forgotPassword(normalizedEmail)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message;
          this.email = '';
          this.submitted = false;
          form.resetForm();
        },

        error: (error: HttpErrorResponse) => {
          this.loading = false;

          if (error.status === 400) {
            this.errorMessage =
              'Le format de l’adresse email est invalide.';
            return;
          }

          this.errorMessage =
            'Impossible de traiter la demande. Veuillez réessayer.';
        }
      });
  }
}