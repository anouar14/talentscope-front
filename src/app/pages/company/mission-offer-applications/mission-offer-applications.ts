import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MissionApplication } from '../../../core/models/mission-application';
import { MissionOffer } from '../../../core/models/mission-offer';
import { MissionApplicationService } from '../../../core/services/mission-application';
import { MissionOfferService } from '../../../core/services/mission-offer';

type MissionApplicationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

type ApplicationAction =
  | 'ACCEPT'
  | 'REJECT';

@Component({
  selector: 'app-mission-offer-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './mission-offer-applications.html',
  styleUrl: './mission-offer-applications.css'
})
export class MissionOfferApplications implements OnInit {
  offer: MissionOffer | null = null;
  applications: MissionApplication[] = [];

  loading = false;
  errorMessage = '';

  processingApplicationId: string | null = null;

  selectedApplication: MissionApplication | null = null;
  selectedAction: ApplicationAction | null = null;

  actionSuccessMessage = '';
  actionErrorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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

    this.loadPage(offerId);
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

  get hasApplications(): boolean {
    return this.applications.length > 0;
  }

  get offerIsOpen(): boolean {
    return this.offer?.status === 'OPEN';
  }

  get confirmationTitle(): string {
    return this.selectedAction === 'ACCEPT'
      ? 'Accepter cette candidature ?'
      : 'Refuser cette candidature ?';
  }

  get confirmationMessage(): string {
    if (!this.selectedApplication) {
      return '';
    }

    if (this.selectedAction === 'ACCEPT') {
      return `La candidature de ${this.selectedApplication.consultantName} sera acceptée et une mission active sera automatiquement créée.`;
    }

    return `La candidature de ${this.selectedApplication.consultantName} sera marquée comme non retenue.`;
  }

  loadPage(offerId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.missionOfferService
      .getOfferById(offerId)
      .subscribe({
        next: offer => {
          this.offer = {
            ...offer,
            technologies: offer.technologies ?? [],
            applicationCount:
              offer.applicationCount ?? 0
          };

          this.loadApplications(offerId);
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement de l’offre :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à consulter cette offre.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Cette offre de mission est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger cette offre.';
        }
      });
  }

  openActionModal(
    application: MissionApplication,
    action: ApplicationAction
  ): void {
    if (
      application.status !== 'PENDING' ||
      !this.offerIsOpen ||
      this.processingApplicationId
    ) {
      return;
    }

    this.selectedApplication = application;
    this.selectedAction = action;
    this.clearActionMessages();
  }

  cancelActionModal(): void {
    if (this.processingApplicationId) {
      return;
    }

    this.selectedApplication = null;
    this.selectedAction = null;
  }

  confirmApplicationAction(): void {
    const application = this.selectedApplication;
    const action = this.selectedAction;

    if (!application || !action) {
      return;
    }

    if (action === 'ACCEPT') {
      this.acceptApplication(application);
      return;
    }

    this.rejectApplication(application);
  }

  viewConsultant(
    consultantId: string
  ): void {
    if (!consultantId) {
      return;
    }

    this.router.navigate([
      '/company/consultants',
      consultantId
    ]);
  }

  isProcessing(
    applicationId: string
  ): boolean {
    return this.processingApplicationId ===
      applicationId;
  }

  getStatusLabel(
    status: MissionApplicationStatus
  ): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      case 'WITHDRAWN':
        return 'Retirée';
      default:
        return status;
    }
  }

  getStatusClass(
    status: MissionApplicationStatus
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

  trackApplication(
    index: number,
    application: MissionApplication
  ): string {
    return application.id;
  }

  private acceptApplication(
    application: MissionApplication
  ): void {
    this.processingApplicationId =
      application.id;

    this.missionApplicationService
      .acceptApplication(application.id)
      .subscribe({
        next: updatedApplication => {
          this.replaceApplication(
            updatedApplication
          );

          this.processingApplicationId = null;
          this.selectedApplication = null;
          this.selectedAction = null;

          this.actionSuccessMessage =
            'La candidature a été acceptée et la mission a été créée.';

          if (this.offer) {
            this.reloadPagePreservingMessage(
              this.offer.id,
              this.actionSuccessMessage
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de l’acceptation de la candidature :',
            error
          );

          this.processingApplicationId = null;
          this.selectedApplication = null;
          this.selectedAction = null;

          if (error.status === 403) {
            this.actionErrorMessage =
              'Vous n’êtes pas autorisé à accepter cette candidature.';
            return;
          }

          if (error.status === 404) {
            this.actionErrorMessage =
              'Cette candidature est introuvable.';
            return;
          }

          if (error.status === 409) {
            this.actionErrorMessage =
              this.extractBackendMessage(
                error,
                'Cette candidature ne peut plus être acceptée.'
              );

            return;
          }

          this.actionErrorMessage =
            'Impossible d’accepter cette candidature.';
        }
      });
  }

  private rejectApplication(
    application: MissionApplication
  ): void {
    this.processingApplicationId =
      application.id;

    this.missionApplicationService
      .rejectApplication(application.id)
      .subscribe({
        next: updatedApplication => {
          this.replaceApplication(
            updatedApplication
          );

          this.processingApplicationId = null;
          this.selectedApplication = null;
          this.selectedAction = null;

          this.actionSuccessMessage =
            'La candidature a été refusée.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du refus de la candidature :',
            error
          );

          this.processingApplicationId = null;
          this.selectedApplication = null;
          this.selectedAction = null;

          if (error.status === 403) {
            this.actionErrorMessage =
              'Vous n’êtes pas autorisé à refuser cette candidature.';
            return;
          }

          if (error.status === 404) {
            this.actionErrorMessage =
              'Cette candidature est introuvable.';
            return;
          }

          if (error.status === 409) {
            this.actionErrorMessage =
              this.extractBackendMessage(
                error,
                'Cette candidature a déjà été traitée.'
              );
            return;
          }

          this.actionErrorMessage =
            'Impossible de refuser cette candidature.';
        }
      });
  }

  private reloadPagePreservingMessage(
    offerId: string,
    successMessage: string
  ): void {
    this.loading = true;
    this.errorMessage = '';

    this.missionOfferService
      .getOfferById(offerId)
      .subscribe({
        next: offer => {
          this.offer = {
            ...offer,
            technologies: offer.technologies ?? [],
            applicationCount:
              offer.applicationCount ?? 0
          };

          this.missionApplicationService
            .getOfferApplications(offerId)
            .subscribe({
              next: applications => {
                this.applications =
                  applications ?? [];

                this.loading = false;
                this.actionSuccessMessage =
                  successMessage;
              },
              error: () => {
                this.loading = false;
                this.actionSuccessMessage =
                  successMessage;
              }
            });
        },
        error: () => {
          this.loading = false;
          this.actionSuccessMessage =
            successMessage;
        }
      });
  }

  private loadApplications(
    offerId: string
  ): void {
    this.missionApplicationService
      .getOfferApplications(offerId)
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
              'Vous n’êtes pas autorisé à consulter les candidatures de cette offre.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Cette offre de mission est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger les candidatures.';
        }
      });
  }

  private replaceApplication(
    updatedApplication: MissionApplication
  ): void {
    this.applications =
      this.applications.map(
        application =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application
      );
  }

  private countByStatus(
    status: MissionApplicationStatus
  ): number {
    return this.applications.filter(
      application =>
        application.status === status
    ).length;
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

    return typeof backendMessage === 'string' &&
      backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }
}