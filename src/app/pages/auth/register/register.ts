import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  role: 'CONSULTANT' | 'COMPANY' = 'CONSULTANT';

  loading = false;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  onRegister(): void {
    this.errorMessage = '';

    if (!this.name || !this.email || !this.password || !this.role) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.loading = true;

    this.authService.register({
      name: this.name,
      email: this.email,
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
      error: () => {
        this.errorMessage = 'Inscription impossible. Veuillez vérifier vos informations.';
        this.loading = false;
      }
    });
  }
}