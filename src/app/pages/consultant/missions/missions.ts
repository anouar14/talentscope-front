import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Mission, MissionStatus } from '../../../core/models/mission';
import { MissionService } from '../../../core/services/mission';

type MissionStatusFilter = 'ALL' | MissionStatus;

@Component({
  selector: 'app-consultant-missions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class ConsultantMissions implements OnInit {
  missions: Mission[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: MissionStatusFilter = 'ALL';

  constructor(private readonly missionService: MissionService) {}

  ngOnInit(): void {
    this.loadMissions();
  }

  get filteredMissions(): Mission[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    return this.missions.filter(mission => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        mission.status === this.selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        mission.title.toLowerCase().includes(normalizedSearch) ||
        mission.description?.toLowerCase().includes(normalizedSearch) ||
        mission.companyName.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }

  get activeMissionCount(): number {
    return this.countMissionsByStatus('ACTIVE');
  }

  get completedMissionCount(): number {
    return this.countMissionsByStatus('COMPLETED');
  }

  get cancelledMissionCount(): number {
    return this.countMissionsByStatus('CANCELLED');
  }

  get hasActiveFilters(): boolean {
    return this.selectedStatus !== 'ALL' || this.searchTerm.trim().length > 0;
  }

  loadMissions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.missionService.getConsultantMissions().subscribe({
      next: missions => {
        this.missions = missions ?? [];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des missions :', error);

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage = 'Vous n’êtes pas autorisé à consulter ces missions.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Votre profil consultant est introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de charger vos missions.';
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

  getStatusLabel(status: MissionStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Terminée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  }

  getStatusClass(status: MissionStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  trackMission(index: number, mission: Mission): string {
    return mission.id;
  }

  private countMissionsByStatus(status: MissionStatus): number {
    return this.missions.filter(mission => mission.status === status).length;
  }
}