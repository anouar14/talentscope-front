import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { CompanyService } from '../../../core/services/company';
import { Company } from '../../../core/models/company';

@Component({
  selector: 'app-company-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class CompanyDashboard implements OnInit {
  company: Company | null = null;
  loading = false;

  constructor(
    private authService: Auth,
    private companyService: CompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompany();
  }

  loadCompany(): void {
    this.loading = true;

    this.companyService.getProfile().subscribe({
      next: (data) => {
        this.company = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}