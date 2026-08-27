import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ContractType, WorkMode } from '../../core/models/invitation';
import { MissionOffer } from '../../core/models/mission-offer';
import { MissionApplicationService } from '../../core/services/mission-application';
import { MissionOfferService } from '../../core/services/mission-offer';

@Component({
  selector: 'app-mission-offer-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './mission-offer-detail.html',
  styleUrl: './mission-offer-detail.css'
})
export class MissionOfferDetail implements OnInit {
  offer: MissionOffer | null = null;

  loading = false;
  applying = false;

  errorMessage = '';
  actionSuccessMessage = '';
  actionErrorMessage = '';

  applicationMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly missionOfferService: MissionOfferService,
    private readonly missionApplicationService: MissionApplicationService
  ) {}

  ngOnInit(): void {
    const offerId =
      this.route.snapshot.paramMap.get('id');

    if (!offerId) {
      this.errorMessage =
        'Identifiant de l’offre invalide.';
      return;
    }

    this.loadOffer(offerId);
  }

  get companyInitial(): string {
    return this.offer?.companyName
      ?.charAt(0)
      .toUpperCase() || 'E';
  }

  get canApply(): boolean {
    return Boolean(
      this.offer &&
      this.offer.status === 'OPEN' &&
      !this.offer.applied &&
      !this.applying
    );
  }

  get hasTechnologies(): boolean {
    return (
      this.offer?.technologies?.length ?? 0
    ) > 0;
  }

  loadOffer(offerId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearMessages();

    this.missionOfferService
      .getOfferById(offerId)
      .subscribe({
        next: offer => {
          this.offer = {
            ...offer,
            technologies: offer.technologies ?? []
          };

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement de l’offre :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Cette offre n’est plus disponible.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Cette offre de mission est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger cette offre de mission.';
        }
      });
  }

  apply(): void {
    const currentOffer = this.offer;

    if (!currentOffer || !this.canApply) {
      return;
    }

    if (this.applicationMessage.length > 2000) {
      this.actionErrorMessage =
        'Votre message ne peut pas dépasser 2000 caractères.';
      return;
    }

    this.applying = true;
    this.clearMessages();

    this.missionApplicationService
      .apply(
        currentOffer.id,
        {
          message:
            this.applicationMessage.trim() || null
        }
      )
      .subscribe({
        next: application => {
          this.offer = {
            ...currentOffer,
            applied: true,
            applicationStatus: application.status,
            applicationCount:
              currentOffer.applicationCount + 1
          };

          this.applying = false;
          this.applicationMessage = '';

          this.actionSuccessMessage =
            'Votre candidature a bien été envoyée à l’entreprise.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la candidature :',
            error
          );

          this.applying = false;

          if (error.status === 403) {
            this.actionErrorMessage =
              'Vous n’êtes pas autorisé à postuler à cette mission.';
            return;
          }

          if (error.status === 404) {
            this.actionErrorMessage =
              'Cette offre de mission est introuvable.';
            return;
          }

          if (error.status === 409) {
            this.actionErrorMessage =
              this.extractBackendMessage(
                error,
                'Vous ne pouvez pas postuler à cette mission.'
              );

            this.loadOffer(currentOffer.id);
            return;
          }

          this.actionErrorMessage =
            'Impossible d’envoyer votre candidature.';
        }
      });
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

  getSalaryLabel(
    salary: number | null
  ): string {
    if (salary === null || salary === undefined) {
      return 'Non renseignée';
    }

    return `${salary.toLocaleString('fr-FR')} DT`;
  }

  getExperienceLabel(
    experienceYears: number | null
  ): string {
    if (
      experienceYears === null ||
      experienceYears === undefined
    ) {
      return 'Non renseignée';
    }

    if (experienceYears === 0) {
      return 'Débutant accepté';
    }

    return `${experienceYears} an(s) minimum`;
  }

  getApplicationStatusLabel(): string {
    switch (this.offer?.applicationStatus) {
      case 'PENDING':
        return 'Votre candidature est en attente de réponse.';
      case 'ACCEPTED':
        return 'Votre candidature a été acceptée.';
      case 'REJECTED':
        return 'Votre candidature n’a pas été retenue.';
      case 'WITHDRAWN':
        return 'Votre candidature a été retirée.';
      default:
        return '';
    }
  }

  private clearMessages(): void {
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

    return typeof backendMessage === 'string' &&
      backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }
}