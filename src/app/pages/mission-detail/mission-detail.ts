import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractType, WorkMode } from '../../core/models/invitation';
import { Mission, MissionStatus } from '../../core/models/mission';
import { CompanyService } from '../../core/services/company';
import { ConsultantService } from '../../core/services/consultant';
import { MissionService } from '../../core/services/mission';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.css'
})
export class MissionDetail implements OnInit, OnDestroy {
  mission: Mission | null = null;

  companyImageObjectUrl: string | null = null;
  consultantImageObjectUrl: string | null = null;

  loading = false;
  updating = false;

  errorMessage = '';
  actionSuccessMessage = '';
  actionErrorMessage = '';

  isCompanyView = false;

  backLink = '/';
  backLabel = 'Retour';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly missionService: MissionService,
    private readonly companyService: CompanyService,
    private readonly consultantService: ConsultantService
  ) {}

  ngOnInit(): void {
    this.configureView();

    const missionId = this.route.snapshot.paramMap.get('id');

    if (!missionId) {
      this.errorMessage =
        'Identifiant de mission invalide.';
      return;
    }

    this.loadMission(missionId);
  }

  ngOnDestroy(): void {
    this.revokeProfileImageUrls();
  }

  get consultantInitial(): string {
    return this.mission?.consultantName
      ?.charAt(0)
      .toUpperCase() || 'C';
  }

  get companyInitial(): string {
    return this.mission?.companyName
      ?.charAt(0)
      .toUpperCase() || 'E';
  }

  get canManageMission(): boolean {
    return this.isCompanyView &&
      this.mission?.status === 'ACTIVE';
  }

  get hasTechnologies(): boolean {
    return (this.mission?.technologies?.length ?? 0) > 0;
  }

  loadMission(missionId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.missionService.getMissionById(missionId).subscribe({
      next: mission => {
        this.mission = {
          ...mission,
          technologies: mission.technologies ?? []
        };

        this.loadCompanyImage(mission.companyId);
        this.loadConsultantImage(mission.consultantId);

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement de la mission :',
          error
        );

        this.loading = false;
        this.errorMessage =
          this.getLoadErrorMessage(error);
      }
    });
  }

  completeMission(): void {
    if (!this.mission || !this.canManageMission) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous marquer la mission « ${this.mission.title} » comme terminée ?`
    );

    if (confirmed) {
      this.updateStatus('COMPLETED');
    }
  }

  cancelMission(): void {
    if (!this.mission || !this.canManageMission) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous annuler la mission « ${this.mission.title} » ? Cette action est définitive.`
    );

    if (confirmed) {
      this.updateStatus('CANCELLED');
    }
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

  getContractTypeLabel(
    contractType: ContractType | null
  ): string {
    switch (contractType) {
      case 'CDI':
        return 'CDI';
      case 'CDD':
        return 'CDD';
      case 'FREELANCE':
        return 'Freelance';
      case 'INTERNSHIP':
        return 'Stage';
      case 'OTHER':
        return 'Autre';
      default:
        return 'Non renseigné';
    }
  }

  getWorkModeLabel(workMode: WorkMode | null): string {
    switch (workMode) {
      case 'ONSITE':
        return 'Sur site';
      case 'REMOTE':
        return 'À distance';
      case 'HYBRID':
        return 'Hybride';
      default:
        return 'Non renseigné';
    }
  }

  getSalaryLabel(salary: number | null): string {
    if (salary === null || salary === undefined) {
      return 'Non renseignée';
    }

    return `${salary.toLocaleString('fr-FR')} DT`;
  }

  private loadCompanyImage(companyId: string): void {
    this.revokeCompanyImageUrl();

    if (!companyId) {
      return;
    }

    this.companyService
      .getProfileImage(companyId)
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

  private loadConsultantImage(
    consultantId: string
  ): void {
    this.revokeConsultantImageUrl();

    if (!consultantId) {
      return;
    }

    this.consultantService
      .getProfileImage(consultantId)
      .subscribe({
        next: blob => {
          if (!blob || blob.size === 0) {
            return;
          }

          this.revokeConsultantImageUrl();
          this.consultantImageObjectUrl =
            URL.createObjectURL(blob);
        },
        error: () => {
          this.revokeConsultantImageUrl();
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

  private revokeConsultantImageUrl(): void {
    if (!this.consultantImageObjectUrl) {
      return;
    }

    URL.revokeObjectURL(
      this.consultantImageObjectUrl
    );

    this.consultantImageObjectUrl = null;
  }

  private revokeProfileImageUrls(): void {
    this.revokeCompanyImageUrl();
    this.revokeConsultantImageUrl();
  }

  private updateStatus(status: MissionStatus): void {
    if (!this.mission) {
      return;
    }

    this.updating = true;
    this.clearActionMessages();

    this.missionService
      .updateMissionStatus(
        this.mission.id,
        status
      )
      .subscribe({
        next: updatedMission => {
          this.mission = {
            ...updatedMission,
            technologies: updatedMission.technologies ?? []
          };

          this.updating = false;

          this.actionSuccessMessage =
            status === 'COMPLETED'
              ? 'La mission a été marquée comme terminée.'
              : 'La mission a été annulée.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la modification de la mission :',
            error
          );

          this.updating = false;
          this.actionErrorMessage =
            this.getUpdateErrorMessage(error);
        }
      });
  }

  private configureView(): void {
    this.isCompanyView =
      this.router.url.startsWith('/company/');

    if (this.isCompanyView) {
      this.backLink = '/company/missions';
      this.backLabel = 'Retour aux missions';
      return;
    }

    if (this.router.url.startsWith('/consultant/')) {
      this.backLink = '/consultant/missions';
      this.backLabel = 'Retour aux missions';
    }
  }

  private getLoadErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 403) {
      return 'Vous n’êtes pas autorisé à consulter cette mission.';
    }

    if (error.status === 404) {
      return 'Cette mission est introuvable.';
    }

    return 'Impossible de charger les détails de la mission.';
  }

  private getUpdateErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 400) {
      return this.extractBackendMessage(
        error,
        'Le nouveau statut de la mission est invalide.'
      );
    }

    if (error.status === 403) {
      return 'Vous n’êtes pas autorisé à modifier cette mission.';
    }

    if (error.status === 404) {
      return 'Cette mission est introuvable.';
    }

    if (error.status === 409) {
      return this.extractBackendMessage(
        error,
        'Cette mission a déjà été terminée ou annulée.'
      );
    }

    return 'Impossible de modifier le statut de la mission.';
  }

  private extractBackendMessage(
    error: HttpErrorResponse,
    defaultMessage: string
  ): string {
    const backendMessage =
      error.error?.message ||
      error.error?.detail ||
      error.error?.error;

    return typeof backendMessage === 'string' &&
      backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }

  private clearActionMessages(): void {
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';
  }
}