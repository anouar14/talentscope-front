import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Invitation } from '../../core/models/invitation';
import { MissionApplication } from '../../core/models/mission-application';
import { MissionOffer } from '../../core/models/mission-offer';
import { CompanyService } from '../../core/services/company';
import { InvitationService } from '../../core/services/invitation';
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
export class MissionOfferDetail implements OnInit, OnDestroy {
  offer: MissionOffer | null = null;

  pendingOfferInvitation: Invitation | null = null;
  companyImageObjectUrl: string | null = null;

  loading = false;
  invitationCheckLoading = false;
  applying = false;

  errorMessage = '';
  invitationCheckErrorMessage = '';
  applicationErrorMessage = '';
  applicationSuccessMessage = '';

  applicationMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly missionOfferService: MissionOfferService,
    private readonly missionApplicationService: MissionApplicationService,
    private readonly invitationService: InvitationService,
    private readonly companyService: CompanyService
  ) {}

  ngOnInit(): void {
    const offerId = this.route.snapshot.paramMap.get('id');

    if (!offerId) {
      this.errorMessage =
        'Identifiant de l’offre invalide.';
      return;
    }

    this.loadOffer(offerId);
  }

  ngOnDestroy(): void {
    this.revokeCompanyImageObjectUrl();
  }

  get canApply(): boolean {
    return !!this.offer &&
      this.offer.status === 'OPEN' &&
      !this.offer.applied &&
      !this.pendingOfferInvitation;
  }

  get hasPendingOfferInvitation(): boolean {
    return this.pendingOfferInvitation !== null;
  }

  get applicationStatusLabel(): string {
    switch (this.offer?.applicationStatus) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Non retenue';
      case 'WITHDRAWN':
        return 'Retirée';
      default:
        return '';
    }
  }

  get applicationStatusClass(): string {
    switch (this.offer?.applicationStatus) {
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

  loadOffer(offerId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.applicationErrorMessage = '';
    this.applicationSuccessMessage = '';

    this.missionOfferService
      .getOfferById(offerId)
      .subscribe({
        next: offer => {
          this.offer = {
            ...offer,
            technologies: offer.technologies ?? []
          };

          this.loading = false;

          this.loadCompanyImage(
            this.offer.companyId
          );

          this.loadPendingOfferInvitation(
            offer.id
          );
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

  submitApplication(): void {
    const offer = this.offer;

    if (
      !offer ||
      !this.canApply ||
      this.applying
    ) {
      return;
    }

    const message = this.applicationMessage.trim();

    if (message.length > 2000) {
      this.applicationErrorMessage =
        'Votre message ne peut pas dépasser 2000 caractères.';
      return;
    }

    this.applying = true;
    this.applicationErrorMessage = '';
    this.applicationSuccessMessage = '';

    this.missionApplicationService
      .apply(
        offer.id,
        {
          message: message || null
        }
      )
      .subscribe({
        next: (application: MissionApplication) => {
          this.applying = false;
          this.applicationMessage = '';

          this.updateOfferFromApplication(application);

          this.applicationSuccessMessage =
            'Votre candidature a été envoyée à l’entreprise.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de l’envoi de la candidature :',
            error
          );

          this.applying = false;

          if (error.status === 400) {
            this.applicationErrorMessage =
              this.extractBackendMessage(
                error,
                'Les informations de votre candidature sont invalides.'
              );
            return;
          }

          if (error.status === 403) {
            this.applicationErrorMessage =
              this.extractBackendMessage(
                error,
                'Vous n’êtes pas autorisé à postuler à cette offre.'
              );
            return;
          }

          if (error.status === 404) {
            this.applicationErrorMessage =
              'Cette offre n’existe plus.';
            return;
          }

          if (error.status === 409) {
            this.applicationErrorMessage =
              this.extractBackendMessage(
                error,
                'Vous ne pouvez pas postuler à cette offre.'
              );

            this.loadPendingOfferInvitation(
              offer.id
            );

            return;
          }

          this.applicationErrorMessage =
            'Impossible d’envoyer votre candidature.';
        }
      });
  }

  viewPendingInvitation(): void {
    if (!this.pendingOfferInvitation) {
      return;
    }

    this.router.navigate(
      ['/consultant/invitations'],
      {
        queryParams: {
          invitationId:
            this.pendingOfferInvitation.id
        }
      }
    );
  }

  getOfferStatusLabel(): string {
    switch (this.offer?.status) {
      case 'OPEN':
        return 'Ouverte';
      case 'FILLED':
        return 'Pourvue';
      case 'CLOSED':
        return 'Clôturée';
      default:
        return '';
    }
  }

  getOfferStatusClass(): string {
    switch (this.offer?.status) {
      case 'OPEN':
        return 'offer-open';
      case 'FILLED':
        return 'offer-filled';
      case 'CLOSED':
        return 'offer-closed';
      default:
        return '';
    }
  }

  getContractTypeLabel(): string {
    switch (this.offer?.contractType) {
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

  getWorkModeLabel(): string {
    switch (this.offer?.workMode) {
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

  getSalaryLabel(): string {
    if (
      this.offer?.salary === null ||
      this.offer?.salary === undefined
    ) {
      return 'Non renseignée';
    }

    return `${this.offer.salary.toLocaleString('fr-FR')} DT`;
  }

  getExperienceLabel(): string {
    const years =
      this.offer?.minimumExperienceYears;

    if (
      years === null ||
      years === undefined
    ) {
      return 'Non renseignée';
    }

    if (years === 0) {
      return 'Débutant accepté';
    }

    return `${years} an(s) minimum`;
  }

  trackTechnology(
    index: number,
    technology: string
  ): string {
    return technology;
  }

  private loadCompanyImage(
    companyId: string
  ): void {
    this.revokeCompanyImageObjectUrl();

    if (!companyId) {
      return;
    }

    this.companyService
      .getProfileImage(companyId)
      .subscribe({
        next: blob => {
          this.revokeCompanyImageObjectUrl();

          this.companyImageObjectUrl =
            URL.createObjectURL(blob);
        },
        error: () => {
          this.revokeCompanyImageObjectUrl();
        }
      });
  }

  private revokeCompanyImageObjectUrl(): void {
    if (!this.companyImageObjectUrl) {
      return;
    }

    URL.revokeObjectURL(
      this.companyImageObjectUrl
    );

    this.companyImageObjectUrl = null;
  }

  private loadPendingOfferInvitation(
    offerId: string
  ): void {
    this.invitationCheckLoading = true;
    this.invitationCheckErrorMessage = '';
    this.pendingOfferInvitation = null;

    this.invitationService
      .getConsultantInvitations()
      .subscribe({
        next: invitations => {
          this.pendingOfferInvitation =
            (invitations ?? []).find(
              invitation =>
                invitation.missionOfferId === offerId &&
                invitation.status === 'PENDING'
            ) ?? null;

          this.invitationCheckLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la vérification des propositions :',
            error
          );

          this.invitationCheckLoading = false;

          this.invitationCheckErrorMessage =
            'Impossible de vérifier vos propositions pour le moment.';
        }
      });
  }

  private updateOfferFromApplication(
    application: MissionApplication
  ): void {
    if (!this.offer) {
      return;
    }

    this.offer = {
      ...this.offer,
      applied: true,
      applicationStatus: application.status
    };
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