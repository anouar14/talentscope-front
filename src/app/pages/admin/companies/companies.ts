import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCompany } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

type CompanyAccountFilter = 'ALL' | 'ENABLED' | 'DISABLED';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './companies.html',
  styleUrl: './companies.css'
})
export class AdminCompanies implements OnInit {
  companies: AdminCompany[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedAccountStatus: CompanyAccountFilter = 'ALL';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  get filteredCompanies(): AdminCompany[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.companies.filter(company => {
      const matchesAccount =
        this.selectedAccountStatus === 'ALL' ||
        (
          this.selectedAccountStatus === 'ENABLED' &&
          company.enabled
        ) ||
        (
          this.selectedAccountStatus === 'DISABLED' &&
          !company.enabled
        );

      const searchableContent = [
        company.companyName,
        company.email,
        company.sector,
        company.location,
        company.website,
        company.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesAccount &&
        (!search || searchableContent.includes(search))
      );
    });
  }

  get enabledCount(): number {
    return this.companies.filter(
      company => company.enabled
    ).length;
  }

  get disabledCount(): number {
    return this.companies.length - this.enabledCount;
  }

  get websiteCount(): number {
    return this.companies.filter(
      company => !!company.website
    ).length;
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedAccountStatus !== 'ALL'
    );
  }

  loadCompanies(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getCompanies().subscribe({
      next: companies => {
        this.companies = companies ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des entreprises :',
          error
        );

        this.loading = false;

        this.errorMessage =
          error.status === 403
            ? 'Vous n’êtes pas autorisé à consulter les entreprises.'
            : 'Impossible de charger les entreprises.';
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedAccountStatus = 'ALL';
  }

  getInitial(company: AdminCompany): string {
    return (
      company.companyName ||
      company.email
    )
      .charAt(0)
      .toUpperCase();
  }

  trackCompany(
    index: number,
    company: AdminCompany
  ): string {
    return company.id;
  }
}