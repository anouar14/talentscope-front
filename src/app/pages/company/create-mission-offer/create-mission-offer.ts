import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  ContractType,
  WorkMode
} from '../../../core/models/invitation';
import { CreateMissionOfferRequest } from '../../../core/models/mission-offer';
import { MissionOfferService } from '../../../core/services/mission-offer';

@Component({
  selector: 'app-create-mission-offer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './create-mission-offer.html',
  styleUrl: './create-mission-offer.css'
})
export class CreateMissionOffer {
  title = '';
  description = '';

  startDate = '';
  endDate = '';

  contractType: ContractType | '' = '';
  workMode: WorkMode | '' = '';

  location = '';

  salary: number | null = null;
  minimumExperienceYears: number | null = null;

  technologiesInput = '';
  notes = '';

  submitting = false;

  errorMessage = '';

  constructor(
    private readonly missionOfferService: MissionOfferService,
    private readonly router: Router
  ) {}

  get technologies(): string[] {
    return this.technologiesInput
      .split(',')
      .map(technology => technology.trim())
      .filter(technology => technology.length > 0)
      .filter(
        (technology, index, values) =>
          values.findIndex(
            value =>
              value.toLowerCase() ===
              technology.toLowerCase()
          ) === index
      );
  }

  get formValid(): boolean {
    return this.title.trim().length >= 3 &&
      this.description.trim().length >= 10 &&
      Boolean(this.startDate) &&
      Boolean(this.contractType) &&
      Boolean(this.workMode) &&
      this.location.trim().length > 0 &&
      this.areDatesValid &&
      this.areNumbersValid;
  }

  get areDatesValid(): boolean {
    if (!this.startDate || !this.endDate) {
      return true;
    }

    return new Date(this.endDate) >=
      new Date(this.startDate);
  }

  get areNumbersValid(): boolean {
    const salaryValid =
      this.salary === null ||
      this.salary >= 0;

    const experienceValid =
      this.minimumExperienceYears === null ||
      this.minimumExperienceYears >= 0;

    return salaryValid && experienceValid;
  }

  submit(): void {
    if (!this.formValid || this.submitting) {
      this.validateBeforeSubmit();
      return;
    }

    const request: CreateMissionOfferRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      startDate: this.startDate,
      endDate: this.endDate || null,
      contractType: this.contractType as ContractType,
      workMode: this.workMode as WorkMode,
      location: this.location.trim(),
      salary: this.salary,
      minimumExperienceYears:
        this.minimumExperienceYears,
      technologies: this.technologies,
      notes: this.notes.trim() || null
    };

    this.submitting = true;
    this.errorMessage = '';

    this.missionOfferService
      .createOffer(request)
      .subscribe({
        next: () => {
          this.submitting = false;

          this.router.navigate(
            ['/company/mission-offers'],
            {
              state: {
                successMessage:
                  'Votre offre de mission a été publiée.'
              }
            }
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la publication de l’offre :',
            error
          );

          this.submitting = false;

          if (error.status === 400) {
            this.errorMessage =
              this.extractBackendMessage(
                error,
                'Certaines informations de l’offre sont invalides.'
              );
            return;
          }

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à publier une offre.';
            return;
          }

          if (error.status === 404) {
            this.errorMessage =
              'Votre profil entreprise est introuvable.';
            return;
          }

          this.errorMessage =
            'Impossible de publier cette offre de mission.';
        }
      });
  }

  private validateBeforeSubmit(): void {
    if (this.title.trim().length < 3) {
      this.errorMessage =
        'Le titre doit contenir au moins 3 caractères.';
      return;
    }

    if (this.description.trim().length < 10) {
      this.errorMessage =
        'La description doit contenir au moins 10 caractères.';
      return;
    }

    if (!this.startDate) {
      this.errorMessage =
        'La date de début est obligatoire.';
      return;
    }

    if (!this.areDatesValid) {
      this.errorMessage =
        'La date de fin doit être postérieure ou égale à la date de début.';
      return;
    }

    if (!this.contractType) {
      this.errorMessage =
        'Le type de contrat est obligatoire.';
      return;
    }

    if (!this.workMode) {
      this.errorMessage =
        'Le mode de travail est obligatoire.';
      return;
    }

    if (!this.location.trim()) {
      this.errorMessage =
        'La localisation est obligatoire.';
      return;
    }

    if (!this.areNumbersValid) {
      this.errorMessage =
        'La rémunération et l’expérience ne peuvent pas être négatives.';
      return;
    }

    this.errorMessage =
      'Veuillez vérifier les informations saisies.';
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