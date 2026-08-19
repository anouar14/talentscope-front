import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminMission,
  AdminMissionStatus
} from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

type MissionStatusFilter =
  | 'ALL'
  | AdminMissionStatus;

@Component({
  selector: 'app-admin-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class AdminMissions implements OnInit {
  missions: AdminMission[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: MissionStatusFilter = 'ALL';

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadMissions();
  }

  get filteredMissions(): AdminMission[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.missions.filter(mission => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        mission.status === this.selectedStatus;

      const searchableContent = [
        mission.title,
        mission.description,
        mission.companyName,
        mission.consultantName,
        mission.consultantTitle,
        mission.location,
        ...mission.technologies
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        (!search || searchableContent.includes(search))
      );
    });
  }

  get activeCount(): number {
    return this.countByStatus('ACTIVE');
  }

  get completedCount(): number {
    return this.countByStatus('COMPLETED');
  }

  get cancelledCount(): number {
    return this.countByStatus('CANCELLED');
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.selectedStatus !== 'ALL'
    );
  }

  loadMissions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getMissions().subscribe({
      next: missions => {
        this.missions = missions ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des missions :',
          error
        );

        this.loading = false;

        this.errorMessage =
          error.status === 403
            ? 'Vous n’êtes pas autorisé à consulter les missions.'
            : 'Impossible de charger les missions.';
      }
    });
  }

  filterByStatus(status: MissionStatusFilter): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }

  getStatusLabel(status: AdminMissionStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Terminée';
      case 'CANCELLED':
        return 'Annulée';
    }
  }

  getStatusClass(status: AdminMissionStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
    }
  }

  formatDate(date: string | null): string {
    if (!date) {
      return 'Non définie';
    }

    return new Intl.DateTimeFormat('fr-FR').format(
      new Date(date)
    );
  }

  formatSalary(salary: number | null): string {
    if (salary == null) {
      return 'Non renseigné';
    }

    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    }).format(salary);
  }

  trackMission(
    index: number,
    mission: AdminMission
  ): string {
    return mission.id;
  }

  private countByStatus(
    status: AdminMissionStatus
  ): number {
    return this.missions.filter(
      mission => mission.status === status
    ).length;
  }
}