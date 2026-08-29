import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ContractType, WorkMode } from '../../../core/models/invitation';
import { MissionOffer } from '../../../core/models/mission-offer';
import { CompanyService } from '../../../core/services/company';
import { MissionOfferService } from '../../../core/services/mission-offer';

type ContractFilter = 'ALL' | ContractType;
type WorkModeFilter = 'ALL' | WorkMode;

@Component({
  selector: 'app-search-missions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search-missions.html',
  styleUrl: './search-missions.css'
})
export class SearchMissions implements OnInit, OnDestroy {
  offers: MissionOffer[] = [];
  companyImageUrls: Record<string, string> = {};

  loading = false;
  errorMessage = '';

  searchTerm = '';
  selectedContract: ContractFilter = 'ALL';
  selectedWorkMode: WorkModeFilter = 'ALL';
  selectedLocation = 'ALL';
  selectedExperience = 'ALL';

  constructor(
    private readonly missionOfferService: MissionOfferService,
    private readonly companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  ngOnDestroy(): void {
    this.clearCompanyImages();
  }

  get filteredOffers(): MissionOffer[] {
    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.offers.filter(offer => {
      const matchesContract =
        this.selectedContract === 'ALL' ||
        offer.contractType === this.selectedContract;

      const matchesWorkMode =
        this.selectedWorkMode === 'ALL' ||
        offer.workMode === this.selectedWorkMode;

      const matchesLocation =
        this.selectedLocation === 'ALL' ||
        offer.location === this.selectedLocation;

      const matchesExperience =
        this.selectedExperience === 'ALL' ||
        (offer.minimumExperienceYears ?? 0) <=
          Number(this.selectedExperience);

      const searchableContent = [
        offer.title,
        offer.description,
        offer.companyName,
        offer.location,
        offer.contractType,
        offer.workMode,
        ...(offer.technologies ?? [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableContent.includes(search);

      return matchesContract &&
        matchesWorkMode &&
        matchesLocation &&
        matchesExperience &&
        matchesSearch;
    });
  }

  get locations(): string[] {
    return [
      ...new Set(
        this.offers
          .map(offer => offer.location?.trim())
          .filter(
            (location): location is string =>
              Boolean(location)
          )
      )
    ].sort((a, b) =>
      a.localeCompare(b, 'fr')
    );
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 ||
      this.selectedContract !== 'ALL' ||
      this.selectedWorkMode !== 'ALL' ||
      this.selectedLocation !== 'ALL' ||
      this.selectedExperience !== 'ALL';
  }

  get appliedCount(): number {
    return this.offers.filter(
      offer => offer.applied
    ).length;
  }

  loadOffers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.clearCompanyImages();

    this.missionOfferService
      .getOpenOffers()
      .subscribe({
        next: offers => {
          this.offers = (offers ?? []).map(
            offer => ({
              ...offer,
              technologies: offer.technologies ?? []
            })
          );

          this.offers.forEach(offer => {
            this.loadCompanyImage(offer.companyId);
          });

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
              'Vous n’êtes pas autorisé à consulter les offres de mission.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil consultant est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de charger les offres de mission.';
        }
      });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedContract = 'ALL';
    this.selectedWorkMode = 'ALL';
    this.selectedLocation = 'ALL';
    this.selectedExperience = 'ALL';
  }

  getCompanyImageUrl(
    companyId: string
  ): string | null {
    return this.companyImageUrls[companyId] ?? null;
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

  getApplicationLabel(
    offer: MissionOffer
  ): string {
    switch (offer.applicationStatus) {
      case 'PENDING':
        return 'Candidature envoyée';
      case 'ACCEPTED':
        return 'Candidature acceptée';
      case 'REJECTED':
        return 'Candidature non retenue';
      case 'WITHDRAWN':
        return 'Candidature retirée';
      default:
        return 'Voir la mission';
    }
  }

  trackOffer(
    index: number,
    offer: MissionOffer
  ): string {
    return offer.id;
  }

  private loadCompanyImage(
    companyId: string
  ): void {
    if (
      !companyId ||
      this.companyImageUrls[companyId]
    ) {
      return;
    }

    this.companyService
      .getProfileImage(companyId)
      .subscribe({
        next: blob => {
          this.companyImageUrls = {
            ...this.companyImageUrls,
            [companyId]: URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.removeCompanyImageUrl(companyId);
        }
      });
  }

  private removeCompanyImageUrl(
    companyId: string
  ): void {
    const currentUrl =
      this.companyImageUrls[companyId];

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    const {
      [companyId]: removed,
      ...remainingUrls
    } = this.companyImageUrls;

    this.companyImageUrls = remainingUrls;
  }

  private clearCompanyImages(): void {
    Object.values(
      this.companyImageUrls
    ).forEach(url => {
      URL.revokeObjectURL(url);
    });

    this.companyImageUrls = {};
  }
}