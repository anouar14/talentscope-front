import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ContractType, WorkMode } from '../../../core/models/invitation';
import { Mission, MissionStatus } from '../../../core/models/mission';
import { CompanyService } from '../../../core/services/company';
import { MessagingService } from '../../../core/services/messaging';
import { MissionService } from '../../../core/services/mission';

type MissionStatusFilter = 'ALL' | MissionStatus;

@Component({
  selector: 'app-consultant-missions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './missions.html',
  styleUrl: './missions.css'
})
export class ConsultantMissions implements OnInit, OnDestroy {
  missions: Mission[] = [];
  companyImageUrls: Record<string, string> = {};

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: MissionStatusFilter = 'ALL';

  messagingParticipantId: string | null = null;
  messagingErrorMessage = '';

  private readonly loadingCompanyImages = new Set<string>();

  constructor(
    private readonly missionService: MissionService,
    private readonly messagingService: MessagingService,
    private readonly companyService: CompanyService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadMissions();
  }

  ngOnDestroy(): void {
    this.revokeAllCompanyImageUrls();
  }

  get filteredMissions(): Mission[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.missions.filter(mission => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        mission.status === this.selectedStatus;

      const searchableContent = [
        mission.title,
        mission.description,
        mission.companyName,
        mission.location,
        mission.notes,
        mission.contractType,
        mission.workMode,
        ...(mission.technologies ?? [])
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
    return (
      this.selectedStatus !== 'ALL' ||
      this.searchTerm.trim().length > 0
    );
  }

  loadMissions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.messagingErrorMessage = '';

    this.missionService
      .getConsultantMissions()
      .subscribe({
        next: missions => {
          this.missions = (missions ?? []).map(
            mission => ({
              ...mission,
              technologies: mission.technologies ?? []
            })
          );

          this.loadCompanyImages();

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des missions :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à consulter ces missions.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil consultant est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger vos missions.';
        }
      });
  }

  contactCompany(mission: Mission): void {
    if (
      !mission.companyId ||
      this.messagingParticipantId
    ) {
      return;
    }

    this.messagingParticipantId = mission.companyId;
    this.messagingErrorMessage = '';

    this.messagingService
      .openConversation(mission.companyId)
      .subscribe({
        next: conversation => {
          this.messagingParticipantId = null;

          this.router.navigate(
            ['/messaging'],
            {
              queryParams: {
                conversationId: conversation.id
              }
            }
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de l’ouverture de la conversation :',
            error
          );

          this.messagingParticipantId = null;

          this.messagingErrorMessage =
            'Impossible d’ouvrir la conversation avec cette entreprise.';
        }
      });
  }

  isOpeningConversation(
    companyId: string
  ): boolean {
    return this.messagingParticipantId === companyId;
  }

  getCompanyImageUrl(
    companyId: string
  ): string | null {
    return this.companyImageUrls[companyId] ?? null;
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

  getWorkModeLabel(
    workMode: WorkMode | null
  ): string {
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

  trackMission(
    index: number,
    mission: Mission
  ): string {
    return mission.id;
  }

  private loadCompanyImages(): void {
    const companyIds = [
      ...new Set(
        this.missions
          .map(mission => mission.companyId)
          .filter(
            (companyId): companyId is string =>
              Boolean(companyId)
          )
      )
    ];

    companyIds.forEach(companyId => {
      this.loadCompanyImage(companyId);
    });
  }

  private loadCompanyImage(companyId: string): void {
    if (
      !companyId ||
      this.companyImageUrls[companyId] ||
      this.loadingCompanyImages.has(companyId)
    ) {
      return;
    }

    this.loadingCompanyImages.add(companyId);

    this.companyService
      .getProfileImage(companyId)
      .subscribe({
        next: blob => {
          this.loadingCompanyImages.delete(companyId);

          if (!blob || blob.size === 0) {
            return;
          }

          const existingUrl =
            this.companyImageUrls[companyId];

          if (existingUrl) {
            URL.revokeObjectURL(existingUrl);
          }

          this.companyImageUrls = {
            ...this.companyImageUrls,
            [companyId]: URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.loadingCompanyImages.delete(companyId);
        }
      });
  }

  private revokeAllCompanyImageUrls(): void {
    Object.values(this.companyImageUrls).forEach(
      imageUrl => URL.revokeObjectURL(imageUrl)
    );

    this.companyImageUrls = {};
    this.loadingCompanyImages.clear();
  }

  private countMissionsByStatus(
    status: MissionStatus
  ): number {
    return this.missions.filter(
      mission =>
        mission.status === status
    ).length;
  }
}