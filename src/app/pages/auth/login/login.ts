import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  onLogin(): void {

    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.loading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({

      next: (response) => {

        this.authService.saveAuth(response);

        if (response.role === 'CONSULTANT') {
          this.router.navigate(['/consultant/dashboard']);
        }
        else if (response.role === 'COMPANY') {
          this.router.navigate(['/company/dashboard']);
        }
        else {
          this.router.navigate(['/']);
        }

      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          'Email ou mot de passe incorrect.';

        this.loading = false;
      }

    });
  }
}