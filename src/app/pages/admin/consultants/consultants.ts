import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminConsultant } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
type AccountFilter = 'ALL' | 'ENABLED' | 'DISABLED';

@Component({
  selector: 'app-admin-consultants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './consultants.html',
  styleUrl: './consultants.css'
})
export class AdminConsultants implements OnInit {
  consultants: AdminConsultant[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedAvailability: AvailabilityFilter = 'ALL';
  selectedAccountStatus: AccountFilter = 'ALL';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadConsultants();
  }

  get filteredConsultants(): AdminConsultant[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.consultants.filter(consultant => {
      const matchesAvailability =
        this.selectedAvailability === 'ALL' ||
        (
          this.selectedAvailability === 'AVAILABLE' &&
          consultant.available
        ) ||
        (
          this.selectedAvailability === 'UNAVAILABLE' &&
          !consultant.available
        );

      const matchesAccount =
        this.selectedAccountStatus === 'ALL' ||
        (
          this.selectedAccountStatus === 'ENABLED' &&
          consultant.enabled
        ) ||
        (
          this.selectedAccountStatus === 'DISABLED' &&
          !consultant.enabled
        );

      const searchableContent = [
        consultant.firstName,
        consultant.lastName,
        consultant.email,
        consultant.title,
        consultant.location,
        ...consultant.skills
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesAvailability &&
        matchesAccount &&
        (!search || searchableContent.includes(search))
      );
    });
  }

  get availableCount(): number {
    return this.consultants.filter(
      consultant => consultant.available
    ).length;
  }

  get unavailableCount(): number {
    return this.consultants.length - this.availableCount;
  }

  get cvCount(): number {
    return this.consultants.filter(
      consultant => consultant.cvAvailable
    ).length;
  }

  get disabledCount(): number {
    return this.consultants.filter(
      consultant => !consultant.enabled
    ).length;
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedAvailability !== 'ALL' ||
      this.selectedAccountStatus !== 'ALL'
    );
  }

  loadConsultants(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getConsultants().subscribe({
      next: consultants => {
        this.consultants = consultants ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des consultants :',
          error
        );

        this.loading = false;

        this.errorMessage =
          error.status === 403
            ? 'Vous n’êtes pas autorisé à consulter les consultants.'
            : 'Impossible de charger les consultants.';
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedAvailability = 'ALL';
    this.selectedAccountStatus = 'ALL';
  }

  getDisplayName(consultant: AdminConsultant): string {
    const name = [
      consultant.firstName,
      consultant.lastName
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || consultant.email;
  }

  getInitial(consultant: AdminConsultant): string {
    return this.getDisplayName(consultant)
      .charAt(0)
      .toUpperCase();
  }

  trackConsultant(
    index: number,
    consultant: AdminConsultant
  ): string {
    return consultant.id;
  }
}