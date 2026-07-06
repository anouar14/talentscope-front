import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ConsultantService } from '../../../core/services/consultant';
import { Consultant } from '../../../core/models/consultant';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class ConsultantDashboard implements OnInit {
  consultant: Consultant | null = null;
  profileCompletion = 0;
  loading = false;

  constructor(
    private authService: Auth,
    private consultantService: ConsultantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.consultantService.getProfile().subscribe({
      next: (data) => {
        this.consultant = {
          ...data,
          skills: data.skills || []
        };

        this.profileCompletion = this.calculateCompletion(this.consultant);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  calculateCompletion(c: Consultant): number {
    const fields = [
      c.firstName,
      c.lastName,
      c.title,
      c.location,
      c.experienceYears > 0,
      c.skills && c.skills.length > 0,
      c.cvUrl
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}