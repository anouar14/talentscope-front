import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MissionApplication } from '../../../core/models/mission-application';
import { MissionApplicationService } from '../../../core/services/mission-application';

type ApplicationStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

@Component({
  selector: 'app-consultant-mission-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './mission-applications.html',
  styleUrl: './mission-applications.css'
})
export class ConsultantMissionApplications implements OnInit {
  applications: MissionApplication[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: ApplicationStatusFilter = 'ALL';

  constructor(
    private readonly missionApplicationService: MissionApplicationService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  get filteredApplications(): MissionApplication[] {
    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.applications.filter(application => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        application.status === this.selectedStatus;

      const searchableContent = [
        application.missionTitle,
        application.companyName,
        application.message
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableContent.includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  get pendingCount(): number {
    return this.countByStatus('PENDING');
  }

  get acceptedCount(): number {
    return this.countByStatus('ACCEPTED');
  }

  get rejectedCount(): number {
    return this.countByStatus('REJECTED');
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 ||
      this.selectedStatus !== 'ALL';
  }

  loadApplications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.missionApplicationService
      .getConsultantApplications()
      .subscribe({
        next: applications => {
          this.applications =
            applications ?? [];

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des candidatures :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à consulter ces candidatures.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil consultant est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger vos candidatures.';
        }
      });
  }

  filterByStatus(
    status: ApplicationStatusFilter
  ): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }

  getStatusLabel(
    status: MissionApplication['status']
  ): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Non retenue';
      case 'WITHDRAWN':
        return 'Retirée';
      default:
        return status;
    }
  }

  getStatusClass(
    status: MissionApplication['status']
  ): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      case 'WITHDRAWN':
        return 'status-withdrawn';
      default:
        return '';
    }
  }

  getStatusDescription(
    application: MissionApplication
  ): string {
    switch (application.status) {
      case 'PENDING':
        return 'Votre candidature est en cours d’étude par l’entreprise.';
      case 'ACCEPTED':
        return 'Votre candidature a été acceptée. La mission est désormais disponible dans votre espace Missions.';
      case 'REJECTED':
        return 'Cette candidature n’a pas été retenue.';
      case 'WITHDRAWN':
        return 'Cette candidature a été retirée.';
      default:
        return '';
    }
  }

  trackApplication(
    index: number,
    application: MissionApplication
  ): string {
    return application.id;
  }

  private countByStatus(
    status: MissionApplication['status']
  ): number {
    return this.applications.filter(
      application =>
        application.status === status
    ).length;
  }
}