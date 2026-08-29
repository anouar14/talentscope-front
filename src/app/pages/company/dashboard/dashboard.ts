import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Company } from '../../../core/models/company';
import { Invitation } from '../../../core/models/invitation';
import { Mission } from '../../../core/models/mission';
import { Auth } from '../../../core/services/auth';
import { CompanyService } from '../../../core/services/company';
import { ConsultantService } from '../../../core/services/consultant';
import { InvitationService } from '../../../core/services/invitation';
import { MissionService } from '../../../core/services/mission';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class CompanyDashboard implements OnInit, OnDestroy {
  company: Company | null = null;
  invitations: Invitation[] = [];
  missions: Mission[] = [];

  companyImageObjectUrl: string | null = null;
  consultantImageUrls: Record<string, string> = {};

  loading = false;
  errorMessage = '';

  private readonly loadingConsultantImages =
    new Set<string>();

  constructor(
    private readonly authService: Auth,
    private readonly companyService: CompanyService,
    private readonly consultantService: ConsultantService,
    private readonly invitationService: InvitationService,
    private readonly missionService: MissionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.revokeCompanyImageUrl();
    this.revokeAllConsultantImageUrls();
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

  get acceptanceRate(): number {
    if (this.totalInvitations === 0) {
      return 0;
    }

    return Math.round(
      (this.acceptedInvitations / this.totalInvitations) * 100
    );
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      company: this.companyService.getProfile(),
      invitations: this.invitationService.getCompanyInvitations(),
      missions: this.missionService.getCompanyMissions()
    }).subscribe({
      next: data => {
        this.company = data.company;
        this.invitations = data.invitations ?? [];
        this.missions = data.missions ?? [];

        this.loadCompanyImage();
        this.loadConsultantImages();

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement du dashboard entreprise :',
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
            'Votre profil entreprise est introuvable.';
          return;
        }

        this.errorMessage =
          'Impossible de charger le tableau de bord.';
      }
    });
  }

  getConsultantImageUrl(
    consultantId: string
  ): string | null {
    return this.consultantImageUrls[consultantId] ?? null;
  }

  getInvitationStatusLabel(
    status: Invitation['status']
  ): string {
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

  getInvitationStatusClass(
    status: Invitation['status']
  ): string {
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

  getMissionStatusLabel(
    status: Mission['status']
  ): string {
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

  getMissionStatusClass(
    status: Mission['status']
  ): string {
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

  trackInvitation(
    index: number,
    invitation: Invitation
  ): string {
    return invitation.id;
  }

  trackMission(
    index: number,
    mission: Mission
  ): string {
    return mission.id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadCompanyImage(): void {
    if (!this.company?.id) {
      return;
    }

    this.revokeCompanyImageUrl();

    this.companyService
      .getProfileImage(this.company.id)
      .subscribe({
        next: blob => {
          if (!blob || blob.size === 0) {
            return;
          }

          this.revokeCompanyImageUrl();

          this.companyImageObjectUrl =
            URL.createObjectURL(blob);
        },
        error: () => {
          this.revokeCompanyImageUrl();
        }
      });
  }

  private loadConsultantImages(): void {
    const consultantIds = [
      ...new Set([
        ...this.recentInvitations.map(
          invitation => invitation.consultantId
        ),
        ...this.recentMissions.map(
          mission => mission.consultantId
        )
      ].filter(
        (consultantId): consultantId is string =>
          Boolean(consultantId)
      ))
    ];

    consultantIds.forEach(consultantId => {
      this.loadConsultantImage(consultantId);
    });
  }

  private loadConsultantImage(
    consultantId: string
  ): void {
    if (
      !consultantId ||
      this.consultantImageUrls[consultantId] ||
      this.loadingConsultantImages.has(consultantId)
    ) {
      return;
    }

    this.loadingConsultantImages.add(consultantId);

    this.consultantService
      .getProfileImage(consultantId)
      .subscribe({
        next: blob => {
          this.loadingConsultantImages.delete(consultantId);

          if (!blob || blob.size === 0) {
            return;
          }

          this.consultantImageUrls = {
            ...this.consultantImageUrls,
            [consultantId]: URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.loadingConsultantImages.delete(consultantId);
        }
      });
  }

  private revokeCompanyImageUrl(): void {
    if (!this.companyImageObjectUrl) {
      return;
    }

    URL.revokeObjectURL(
      this.companyImageObjectUrl
    );

    this.companyImageObjectUrl = null;
  }

  private revokeAllConsultantImageUrls(): void {
    Object.values(this.consultantImageUrls).forEach(
      imageUrl => URL.revokeObjectURL(imageUrl)
    );

    this.consultantImageUrls = {};
    this.loadingConsultantImages.clear();
  }
}