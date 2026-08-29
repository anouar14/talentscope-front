import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { MissionOffer } from '../../../core/models/mission-offer';
import {
  CompanyService,
  ConsultantMatchResult
} from '../../../core/services/company';
import { ConsultantService } from '../../../core/services/consultant';
import { MissionOfferService } from '../../../core/services/mission-offer';

@Component({
  selector: 'app-mission-offer-matching',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl:
    './mission-offer-matching.html',
  styleUrl:
    './mission-offer-matching.css'
})
export class MissionOfferMatching implements OnInit, OnDestroy {
  offer: MissionOffer | null = null;
  results: ConsultantMatchResult[] = [];

  profileImageUrls: Record<string, string> = {};

  loading = false;
  matchingLoading = false;
  matchingExecuted = false;

  errorMessage = '';
  matchingErrorMessage = '';

  analyzedConsultants = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly missionOfferService: MissionOfferService,
    private readonly companyService: CompanyService,
    private readonly consultantService: ConsultantService
  ) {}

  ngOnInit(): void {
    const offerId =
      this.route.snapshot.paramMap.get(
        'id'
      );

    if (!offerId) {
      this.errorMessage =
        'Identifiant de l’offre invalide.';
      return;
    }

    this.loadOffer(offerId);
  }

  ngOnDestroy(): void {
    this.clearProfileImages();
  }

  get topResult():
    ConsultantMatchResult |
    null {
    return this.results.length > 0
      ? this.results[0]
      : null;
  }

  getProfileImageUrl(
    consultantId: string
  ): string | null {
    return this.profileImageUrls[
      consultantId
    ] ?? null;
  }

  loadOffer(
    offerId: string
  ): void {
    this.loading = true;
    this.errorMessage = '';
    this.matchingErrorMessage = '';

    this.missionOfferService
      .getOfferById(offerId)
      .subscribe({
        next: offer => {
          this.offer = {
            ...offer,
            technologies:
              offer.technologies ?? []
          };

          this.loading = false;

          this.launchMatching();
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors du chargement de l’offre :',
            error
          );

          this.loading = false;

          if (error.status === 403) {
            this.errorMessage =
              'Vous n’êtes pas autorisé à analyser cette offre.';
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

  launchMatching(): void {
    if (
      !this.offer ||
      this.matchingLoading
    ) {
      return;
    }

    const jobDescription =
      this.buildMatchingDescription(
        this.offer
      );

    this.matchingLoading = true;
    this.matchingExecuted = false;
    this.matchingErrorMessage = '';
    this.results = [];
    this.analyzedConsultants = 0;

    this.clearProfileImages();

    this.companyService
      .matchConsultants(jobDescription)
      .subscribe({
        next: response => {
          this.results =
            (response.results ?? []).map(
              result => ({
                ...result,
                confidence:
                  result.confidence ?? 0,
                matchedSkills:
                  result.matchedSkills ?? [],
                missingSkills:
                  result.missingSkills ?? [],
                strengths:
                  result.strengths ?? [],
                weaknesses:
                  result.weaknesses ?? [],
                scoreBreakdown: {
                  requiredSkillsScore:
                    result.scoreBreakdown
                      ?.requiredSkillsScore ??
                    0,
                  preferredSkillsScore:
                    result.scoreBreakdown
                      ?.preferredSkillsScore ??
                    0,
                  experienceScore:
                    result.scoreBreakdown
                      ?.experienceScore ??
                    0,
                  titleScore:
                    result.scoreBreakdown
                      ?.titleScore ??
                    0,
                  locationScore:
                    result.scoreBreakdown
                      ?.locationScore ??
                    0,
                  aiScore:
                    result.scoreBreakdown
                      ?.aiScore ??
                    0
                }
              })
            );

          this.results.forEach(
            result => {
              this.loadProfileImage(
                result.consultantId
              );
            }
          );

          this.analyzedConsultants =
            response.analyzedConsultants ??
            0;

          this.matchingExecuted = true;
          this.matchingLoading = false;
        },
        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Erreur lors du matching de l’offre :',
            error
          );

          this.matchingLoading = false;
          this.matchingExecuted = true;

          if (error.status === 400) {
            this.matchingErrorMessage =
              'Les informations de cette offre ne permettent pas d’effectuer le matching.';
            return;
          }

          if (error.status === 403) {
            this.matchingErrorMessage =
              'Vous n’êtes pas autorisé à utiliser le matching IA.';
            return;
          }

          this.matchingErrorMessage =
            'Impossible d’effectuer le matching IA. Vérifiez que le backend et Ollama sont disponibles.';
        }
      });
  }

  viewConsultantProfile(
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

  proposeOffer(
    consultantId: string
  ): void {
    if (
      !consultantId ||
      !this.offer ||
      this.offer.status !== 'OPEN'
    ) {
      return;
    }

    this.router.navigate(
      [
        '/company/consultants',
        consultantId
      ],
      {
        queryParams: {
          missionOfferId:
            this.offer.id
        }
      }
    );
  }

  getScoreClass(
    score: number
  ): string {
    if (score >= 80) {
      return 'score-excellent';
    }

    if (score >= 65) {
      return 'score-good';
    }

    if (score >= 45) {
      return 'score-average';
    }

    return 'score-low';
  }

  getScoreLabel(
    score: number
  ): string {
    if (score >= 80) {
      return 'Excellent match';
    }

    if (score >= 65) {
      return 'Profil recommandé';
    }

    if (score >= 45) {
      return 'Compatibilité possible';
    }

    return 'Faible compatibilité';
  }

  getConfidenceLabel(
    confidence: number
  ): string {
    if (confidence >= 85) {
      return 'Analyse très fiable';
    }

    if (confidence >= 65) {
      return 'Analyse fiable';
    }

    if (confidence >= 45) {
      return 'Fiabilité moyenne';
    }

    return 'Données insuffisantes';
  }

  getContractTypeLabel(): string {
    switch (
      this.offer?.contractType
    ) {
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

  trackResult(
    index: number,
    result: ConsultantMatchResult
  ): string {
    return result.consultantId;
  }

  trackSkill(
    index: number,
    skill: string
  ): string {
    return skill;
  }

  private loadProfileImage(
    consultantId: string
  ): void {
    if (
      !consultantId ||
      this.profileImageUrls[
        consultantId
      ]
    ) {
      return;
    }

    this.consultantService
      .getProfileImage(
        consultantId
      )
      .subscribe({
        next: blob => {
          this.profileImageUrls = {
            ...this.profileImageUrls,
            [consultantId]:
              URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.removeProfileImageUrl(
            consultantId
          );
        }
      });
  }

  private removeProfileImageUrl(
    consultantId: string
  ): void {
    const currentUrl =
      this.profileImageUrls[
        consultantId
      ];

    if (currentUrl) {
      URL.revokeObjectURL(
        currentUrl
      );
    }

    const {
      [consultantId]: removed,
      ...remainingUrls
    } = this.profileImageUrls;

    this.profileImageUrls =
      remainingUrls;
  }

  private clearProfileImages(): void {
    Object.values(
      this.profileImageUrls
    ).forEach(url => {
      URL.revokeObjectURL(url);
    });

    this.profileImageUrls = {};
  }

  private buildMatchingDescription(
    offer: MissionOffer
  ): string {
    const sections: string[] = [];

    sections.push(
      `Titre de la mission : ${offer.title}.`
    );

    if (offer.description?.trim()) {
      sections.push(
        `Description : ${offer.description.trim()}`
      );
    }

    if (
      offer.technologies.length > 0
    ) {
      sections.push(
        `Compétences et technologies recherchées : ${offer.technologies.join(', ')}.`
      );
    }

    if (
      offer.minimumExperienceYears !==
        null &&
      offer.minimumExperienceYears !==
        undefined
    ) {
      sections.push(
        `Expérience minimale souhaitée : ${offer.minimumExperienceYears} année(s).`
      );
    }

    if (offer.location?.trim()) {
      sections.push(
        `Localisation : ${offer.location.trim()}.`
      );
    }

    if (offer.workMode) {
      sections.push(
        `Mode de travail : ${this.getWorkModeLabel()}.`
      );
    }

    if (offer.contractType) {
      sections.push(
        `Type de contrat : ${this.getContractTypeLabel()}.`
      );
    }

    if (offer.notes?.trim()) {
      sections.push(
        `Informations complémentaires : ${offer.notes.trim()}`
      );
    }

    return sections.join(' ');
  }
}