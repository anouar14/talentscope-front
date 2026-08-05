import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Consultant } from '../../../core/models/consultant';
import { Invitation } from '../../../core/models/invitation';
import { Mission } from '../../../core/models/mission';
import { Auth } from '../../../core/services/auth';
import { ConsultantService } from '../../../core/services/consultant';
import { InvitationService } from '../../../core/services/invitation';
import { MissionService } from '../../../core/services/mission';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class ConsultantDashboard implements OnInit {
  consultant: Consultant | null = null;
  invitations: Invitation[] = [];
  missions: Mission[] = [];

  profileCompletion = 0;
  loading = false;
  errorMessage = '';

  constructor(
    private readonly authService: Auth,
    private readonly consultantService: ConsultantService,
    private readonly invitationService: InvitationService,
    private readonly missionService: MissionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get totalInvitations(): number {
    return this.invitations.length;
  }

  get pendingInvitations(): number {
    return this.invitations.filter(
      invitation => invitation.status === 'PENDING'
    ).length;
  }

  get acceptedInvitations(): number {
    return this.invitations.filter(
      invitation => invitation.status === 'ACCEPTED'
    ).length;
  }

  get rejectedInvitations(): number {
    return this.invitations.filter(
      invitation => invitation.status === 'REJECTED'
    ).length;
  }

  get activeMissions(): number {
    return this.missions.filter(
      mission => mission.status === 'ACTIVE'
    ).length;
  }

  get completedMissions(): number {
    return this.missions.filter(
      mission => mission.status === 'COMPLETED'
    ).length;
  }

  get cancelledMissions(): number {
    return this.missions.filter(
      mission => mission.status === 'CANCELLED'
    ).length;
  }

  get recentInvitations(): Invitation[] {
    return this.invitations.slice(0, 3);
  }

  get recentMissions(): Mission[] {
    return this.missions.slice(0, 3);
  }

  get availabilityLabel(): string {
    return this.consultant?.available
      ? 'Disponible'
      : 'Indisponible';
  }

  get cvStatusLabel(): string {
    return this.consultant?.cvUrl
      ? 'CV disponible'
      : 'CV non ajouté';
  }

  get analysisStatusLabel(): string {
    return this.consultant?.cvUrl
      ? 'Prête à être lancée'
      : 'CV requis';
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      consultant: this.consultantService.getProfile(),
      invitations: this.invitationService.getConsultantInvitations(),
      missions: this.missionService.getConsultantMissions()
    }).subscribe({
      next: data => {
        this.consultant = {
          ...data.consultant,
          skills: data.consultant.skills ?? []
        };

        this.invitations = data.invitations ?? [];
        this.missions = data.missions ?? [];
        this.profileCompletion = this.calculateCompletion(this.consultant);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement du dashboard consultant :',
          error
        );

        this.loading = false;

        if (error.status === 403) {
          this.errorMessage =
            'Vous n’êtes pas autorisé à consulter ce tableau de bord.';
          return;
        }

        if (error.status === 404) {
          this.errorMessage =
            'Votre profil consultant est introuvable.';
          return;
        }

        this.errorMessage =
          'Impossible de charger le tableau de bord.';
      }
    });
  }

  calculateCompletion(consultant: Consultant): number {
    const fields = [
      consultant.firstName,
      consultant.lastName,
      consultant.title,
      consultant.location,
      consultant.experienceYears > 0,
      consultant.skills.length > 0,
      consultant.cvUrl
    ];

    const completedFields = fields.filter(Boolean).length;

    return Math.round(
      (completedFields / fields.length) * 100
    );
  }

  getInvitationStatusLabel(status: Invitation['status']): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status;
    }
  }

  getInvitationStatusClass(status: Invitation['status']): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-accepted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getMissionStatusLabel(status: Mission['status']): string {
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

  getMissionStatusClass(status: Mission['status']): string {
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

  trackInvitation(index: number, invitation: Invitation): string {
    return invitation.id;
  }

  trackMission(index: number, mission: Mission): string {
    return mission.id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}