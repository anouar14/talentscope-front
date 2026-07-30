import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Mission, MissionStatus } from '../../../core/models/mission';
import { MissionService } from '../../../core/services/mission';

type MissionStatusFilter = 'ALL' | MissionStatus;

@Component({
  selector: 'app-company-missions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class CompanyMissions implements OnInit {
  missions: Mission[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: MissionStatusFilter = 'ALL';

  updatingMissionId: string | null = null;
  actionSuccessMessage = '';
  actionErrorMessage = '';

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
        mission.consultantName.toLowerCase().includes(normalizedSearch) ||
        mission.consultantTitle?.toLowerCase().includes(normalizedSearch);

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
    this.clearActionMessages();

    this.missionService.getCompanyMissions().subscribe({
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
          this.errorMessage = 'Votre profil entreprise est introuvable.';
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

  completeMission(mission: Mission): void {
    if (mission.status !== 'ACTIVE') {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous marquer la mission « ${mission.title} » comme terminée ?`
    );

    if (confirmed) {
      this.updateMissionStatus(mission, 'COMPLETED');
    }
  }

  cancelMission(mission: Mission): void {
    if (mission.status !== 'ACTIVE') {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous annuler la mission « ${mission.title} » ? Cette action est définitive.`
    );

    if (confirmed) {
      this.updateMissionStatus(mission, 'CANCELLED');
    }
  }

  isMissionUpdating(missionId: string): boolean {
    return this.updatingMissionId === missionId;
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

  private updateMissionStatus(mission: Mission, status: MissionStatus): void {
    this.updatingMissionId = mission.id;
    this.clearActionMessages();

    this.missionService.updateMissionStatus(mission.id, status).subscribe({
      next: updatedMission => {
        this.replaceMission(updatedMission);
        this.updatingMissionId = null;

        this.actionSuccessMessage =
          status === 'COMPLETED'
            ? 'La mission a été marquée comme terminée.'
            : 'La mission a été annulée.';
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur lors de la modification de la mission :', error);

        this.updatingMissionId = null;

        if (error.status === 400) {
          this.actionErrorMessage = this.extractBackendMessage(
            error,
            'Le nouveau statut de la mission est invalide.'
          );
          return;
        }

        if (error.status === 403) {
          this.actionErrorMessage = 'Vous n’êtes pas autorisé à modifier cette mission.';
          return;
        }

        if (error.status === 404) {
          this.actionErrorMessage = 'Cette mission est introuvable.';
          return;
        }

        if (error.status === 409) {
          this.actionErrorMessage = this.extractBackendMessage(
            error,
            'Cette mission a déjà été terminée ou annulée.'
          );

          this.loadMissions();
          return;
        }

        this.actionErrorMessage = 'Impossible de modifier le statut de la mission.';
      }
    });
  }

  private replaceMission(updatedMission: Mission): void {
    this.missions = this.missions.map(mission =>
      mission.id === updatedMission.id ? updatedMission : mission
    );
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }

  private extractBackendMessage(
    error: HttpErrorResponse,
    defaultMessage: string
  ): string {
    const backendMessage =
      error.error?.message ||
      error.error?.detail ||
      error.error?.error;

    return typeof backendMessage === 'string' && backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }
}