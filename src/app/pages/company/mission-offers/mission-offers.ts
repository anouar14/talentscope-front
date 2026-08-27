import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  MissionOffer,
  MissionOfferStatus
} from '../../../core/models/mission-offer';
import { MissionOfferService } from '../../../core/services/mission-offer';

type MissionOfferStatusFilter =
  | 'ALL'
  | MissionOfferStatus;

@Component({
  selector: 'app-company-mission-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './mission-offers.html',
  styleUrl: './mission-offers.css'
})
export class CompanyMissionOffers implements OnInit {
  offers: MissionOffer[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedStatus: MissionOfferStatusFilter = 'ALL';

  closingOfferId: string | null = null;
  offerToClose: MissionOffer | null = null;

  actionSuccessMessage = '';
  actionErrorMessage = '';

  constructor(
    private readonly missionOfferService: MissionOfferService
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  get filteredOffers(): MissionOffer[] {
    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.offers.filter(offer => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        offer.status === this.selectedStatus;

      const searchableContent = [
        offer.title,
        offer.description,
        offer.location,
        offer.contractType,
        offer.workMode,
        ...(offer.technologies ?? [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus &&
        (
          !search ||
          searchableContent.includes(search)
        );
    });
  }

  get openCount(): number {
    return this.countByStatus('OPEN');
  }

  get filledCount(): number {
    return this.countByStatus('FILLED');
  }

  get closedCount(): number {
    return this.countByStatus('CLOSED');
  }

  get totalApplications(): number {
    return this.offers.reduce(
      (total, offer) =>
        total + (offer.applicationCount ?? 0),
      0
    );
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 ||
      this.selectedStatus !== 'ALL';
  }

  loadOffers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.clearActionMessages();

    this.missionOfferService
      .getCompanyOffers()
      .subscribe({
        next: offers => {
          this.offers = (offers ?? []).map(
            offer => ({
              ...offer,
              technologies: offer.technologies ?? [],
              applicationCount:
                offer.applicationCount ?? 0
            })
          );

          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des offres :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à consulter ces offres.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil entreprise est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger vos offres de mission.';
        }
      });
  }

  filterByStatus(
    status: MissionOfferStatusFilter
  ): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
  }

  openCloseModal(offer: MissionOffer): void {
    if (
      offer.status !== 'OPEN' ||
      this.closingOfferId
    ) {
      return;
    }

    this.offerToClose = offer;
    this.clearActionMessages();
  }

  cancelCloseModal(): void {
    if (this.closingOfferId) {
      return;
    }

    this.offerToClose = null;
  }

  confirmCloseOffer(): void {
    const offer = this.offerToClose;

    if (
      !offer ||
      offer.status !== 'OPEN' ||
      this.closingOfferId
    ) {
      return;
    }

    this.closingOfferId = offer.id;

    this.missionOfferService
      .closeOffer(offer.id)
      .subscribe({
        next: updatedOffer => {
          this.replaceOffer({
            ...updatedOffer,
            technologies:
              updatedOffer.technologies ?? [],
            applicationCount:
              updatedOffer.applicationCount ?? 0
          });

          this.closingOfferId = null;
          this.offerToClose = null;

          this.actionSuccessMessage =
            'L’offre de mission a été clôturée.';
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la clôture de l’offre :',
            error
          );

          this.closingOfferId = null;
          this.offerToClose = null;

          if (error.status === 403) {
            this.actionErrorMessage =
              'Vous n’êtes pas autorisé à clôturer cette offre.';
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
                'Cette offre n’est plus ouverte.'
              );

            this.loadOffers();
            return;
          }

          this.actionErrorMessage =
            'Impossible de clôturer cette offre.';
        }
      });
  }

  isClosing(
    offerId: string
  ): boolean {
    return this.closingOfferId === offerId;
  }

  getStatusLabel(
    status: MissionOfferStatus
  ): string {
    switch (status) {
      case 'OPEN':
        return 'Ouverte';
      case 'FILLED':
        return 'Pourvue';
      case 'CLOSED':
        return 'Clôturée';
      default:
        return status;
    }
  }

  getStatusClass(
    status: MissionOfferStatus
  ): string {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'FILLED':
        return 'status-filled';
      case 'CLOSED':
        return 'status-closed';
      default:
        return '';
    }
  }

  getContractTypeLabel(
    contractType: MissionOffer['contractType']
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
    workMode: MissionOffer['workMode']
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

  trackOffer(
    index: number,
    offer: MissionOffer
  ): string {
    return offer.id;
  }

  private countByStatus(
    status: MissionOfferStatus
  ): number {
    return this.offers.filter(
      offer => offer.status === status
    ).length;
  }

  private replaceOffer(
    updatedOffer: MissionOffer
  ): void {
    this.offers = this.offers.map(
      offer =>
        offer.id === updatedOffer.id
          ? updatedOffer
          : offer
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

    return typeof backendMessage === 'string' &&
      backendMessage.trim()
      ? backendMessage
      : defaultMessage;
  }
}