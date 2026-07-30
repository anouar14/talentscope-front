import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {CompanyService,ConsultantMatchResult} from '../../../core/services/company';
import { ConsultantService } from '../../../core/services/consultant';
import { Consultant } from '../../../core/models/consultant';

@Component({
  selector: 'app-search-consultants',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './search-consultants.html',
  styleUrls: ['./search-consultants.css']
})
export class SearchConsultants implements OnInit {

  consultants: Consultant[] = [];
  filteredConsultants: Consultant[] = [];

  matchingResults: ConsultantMatchResult[] = [];

  searchTerm = '';
  jobDescription = '';

  loading = false;
  matchingLoading = false;

  errorMessage = '';
  matchingErrorMessage = '';

  matchingExecuted = false;
  analyzedConsultants = 0;

  constructor(
    private consultantService: ConsultantService,
    private companyService: CompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConsultants();
  }

  loadConsultants(): void {
    this.loading = true;
    this.errorMessage = '';

    this.consultantService
      .getAllConsultants()
      .subscribe({
        next: (data) => {
          this.consultants = data.map(
            consultant => ({
              ...consultant,
              skills: consultant.skills ?? []
            })
          );

          this.filteredConsultants =
            this.consultants;

          this.loading = false;
        },

        error: () => {
          this.errorMessage =
            'Impossible de charger les consultants.';

          this.loading = false;
        }
      });
  }

  filterConsultants(): void {
    const term = this.searchTerm
      .toLowerCase()
      .trim();

    if (!term) {
      this.filteredConsultants =
        this.consultants;

      return;
    }

    this.filteredConsultants =
      this.consultants.filter(
        consultant =>
          (consultant.firstName ?? '')
            .toLowerCase()
            .includes(term) ||

          (consultant.lastName ?? '')
            .toLowerCase()
            .includes(term) ||

          (consultant.title ?? '')
            .toLowerCase()
            .includes(term) ||

          (consultant.location ?? '')
            .toLowerCase()
            .includes(term) ||

          (consultant.skills ?? []).some(
            skill =>
              skill
                .toLowerCase()
                .includes(term)
          )
      );
  }

  launchMatching(): void {
    this.matchingErrorMessage = '';
    this.matchingExecuted = false;
    this.matchingResults = [];

    const normalizedDescription =
      this.jobDescription.trim();

    if (normalizedDescription.length < 20) {
      this.matchingErrorMessage =
        'La description du poste doit contenir au moins 20 caractères.';

      return;
    }

    this.matchingLoading = true;

    this.companyService
      .matchConsultants(normalizedDescription)
      .subscribe({
        next: (response) => {
          this.matchingResults =
            response.results ?? [];

          this.analyzedConsultants =
            response.analyzedConsultants;

          this.matchingExecuted = true;
          this.matchingLoading = false;
        },

        error: (error) => {
          console.error(error);

          this.matchingLoading = false;

          if (error.status === 400) {
            this.matchingErrorMessage =
              'La description du poste est invalide.';

            return;
          }

          this.matchingErrorMessage =
            'Impossible d’effectuer le matching IA. Vérifiez que le backend et Ollama sont démarrés.';
        }
      });
  }

  resetMatching(): void {
    this.jobDescription = '';
    this.matchingResults = [];
    this.matchingExecuted = false;
    this.matchingErrorMessage = '';
    this.analyzedConsultants = 0;
  }

  getScoreClass(score: number): string {
    if (score >= 80) {
      return 'score-excellent';
    }

    if (score >= 60) {
      return 'score-good';
    }

    if (score >= 40) {
      return 'score-average';
    }

    return 'score-low';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) {
      return 'Excellent profil';
    }

    if (score >= 60) {
      return 'Bon profil';
    }

    if (score >= 40) {
      return 'Profil moyen';
    }

    return 'Faible compatibilité';
  }
  viewConsultantProfile(
  consultantId: string
): void {
  console.log(
    'Consultant sélectionné :',
    consultantId
  );

  if (!consultantId) {
    console.error(
      'Identifiant du consultant absent'
    );

    return;
  }

  this.router.navigate([
    '/company/consultants',
    consultantId
  ]);
}
}