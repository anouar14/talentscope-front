import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  role: 'CONSULTANT' | 'COMPANY' = 'CONSULTANT';

  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  get passwordsDoNotMatch(): boolean {
    return (
      this.confirmPassword.length > 0 &&
      this.password !== this.confirmPassword
    );
  }

  onRegister(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Veuillez corriger les champs invalides.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;

    this.authService.register({
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      role: this.role
    }).subscribe({
      next: (response) => {
        this.authService.saveAuth(response);

        if (response.role === 'CONSULTANT') {
          this.router.navigate(['/consultant/dashboard']);
        } else if (response.role === 'COMPANY') {
          this.router.navigate(['/company/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },

      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 409) {
          this.errorMessage =
            'Cette adresse email est déjà associée à un compte.';
          return;
        }

        if (error.status === 400) {
          this.errorMessage =
            'Certaines informations saisies sont invalides.';
          return;
        }

        this.errorMessage =
          'Inscription impossible. Veuillez réessayer plus tard.';
      }
    });
  }
}