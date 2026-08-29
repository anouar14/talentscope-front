import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Consultant } from '../../../core/models/consultant';
import {
  CompanyService,
  ConsultantMatchResult,
  ScoreBreakdown
} from '../../../core/services/company';
import { ConsultantService } from '../../../core/services/consultant';

interface ScoreCriterion {
  label: string;
  score: number;
  available: boolean;
}

interface RecommendationLevel {
  label: string;
  description: string;
  stars: number;
  className: string;
}

@Component({
  selector: 'app-search-consultants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-consultants.html',
  styleUrls: ['./search-consultants.css']
})
export class SearchConsultants implements OnInit, OnDestroy {
  consultants: Consultant[] = [];
  filteredConsultants: Consultant[] = [];
  matchingResults: ConsultantMatchResult[] = [];

  profileImageUrls: Record<string, string> = {};

  searchTerm = '';
  jobDescription = '';

  loading = false;
  matchingLoading = false;

  errorMessage = '';
  matchingErrorMessage = '';

  matchingExecuted = false;
  analyzedConsultants = 0;

  constructor(
    private readonly consultantService: ConsultantService,
    private readonly companyService: CompanyService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadConsultants();
  }

  ngOnDestroy(): void {
    this.clearProfileImages();
  }

  loadConsultants(): void {
    this.loading = true;
    this.errorMessage = '';

    this.consultantService.getAllConsultants().subscribe({
      next: consultants => {
        this.consultants = (consultants ?? []).map(consultant => ({
          ...consultant,
          skills: consultant.skills ?? [],
          profileImageUrl: consultant.profileImageUrl ?? null
        }));

        this.filteredConsultants = this.consultants;

        this.consultants.forEach(consultant => {
          this.loadConsultantImage(consultant);
        });

        this.loading = false;
      },
      error: error => {
        console.error(
          'Erreur lors du chargement des consultants :',
          error
        );

        this.errorMessage =
          'Impossible de charger les consultants.';

        this.loading = false;
      }
    });
  }

  filterConsultants(): void {
    const term =
      this.searchTerm.trim().toLowerCase();

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
        next: response => {
          this.matchingResults =
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
                scoreBreakdown:
                  this.normalizeScoreBreakdown(
                    result.scoreBreakdown
                  )
              })
            );

          this.matchingResults.forEach(
            result => {
              const consultant =
                this.consultants.find(
                  currentConsultant =>
                    currentConsultant.id ===
                    result.consultantId
                );

              if (consultant) {
                this.loadConsultantImage(
                  consultant
                );
              }
            }
          );

          this.analyzedConsultants =
            response.analyzedConsultants ?? 0;

          this.matchingExecuted = true;
          this.matchingLoading = false;
        },
        error: error => {
          console.error(
            'Erreur lors du matching IA :',
            error
          );

          this.matchingLoading = false;

          if (error.status === 400) {
            this.matchingErrorMessage =
              'La description du poste est invalide.';
            return;
          }

          if (error.status === 403) {
            this.matchingErrorMessage =
              'Vous n’êtes pas autorisé à utiliser le matching IA.';
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

  getProfileImageUrl(
    consultantId: string
  ): string | null {
    return this.profileImageUrls[
      consultantId
    ] ?? null;
  }

  getScoreCriteria(
    result: ConsultantMatchResult
  ): ScoreCriterion[] {
    const breakdown =
      result.scoreBreakdown;

    return [
      {
        label:
          'Compétences obligatoires',
        score:
          breakdown.requiredSkillsScore,
        available:
          this.isRequiredSkillsCriterionAvailable(
            result
          )
      },
      {
        label:
          'Compétences souhaitées',
        score:
          breakdown.preferredSkillsScore,
        available:
          this.isOptionalCriterionAvailable(
            breakdown.preferredSkillsScore
          )
      },
      {
        label: 'Expérience',
        score:
          breakdown.experienceScore,
        available:
          this.isOptionalCriterionAvailable(
            breakdown.experienceScore
          )
      },
      {
        label:
          'Titre professionnel',
        score:
          breakdown.titleScore,
        available:
          this.isOptionalCriterionAvailable(
            breakdown.titleScore
          )
      },
      {
        label: 'Localisation',
        score:
          breakdown.locationScore,
        available:
          this.isOptionalCriterionAvailable(
            breakdown.locationScore
          )
      },
      {
        label:
          'Analyse qualitative IA',
        score: breakdown.aiScore,
        available: true
      }
    ];
  }

  getRecommendation(
    score: number
  ): RecommendationLevel {
    if (score >= 80) {
      return {
        label: 'Excellent match',
        description:
          'Ce profil répond très fortement aux critères de la mission.',
        stars: 5,
        className:
          'recommendation-excellent'
      };
    }

    if (score >= 65) {
      return {
        label: 'Profil recommandé',
        description:
          'Ce profil présente une bonne compatibilité avec la mission.',
        stars: 4,
        className:
          'recommendation-recommended'
      };
    }

    if (score >= 45) {
      return {
        label:
          'Compatibilité possible',
        description:
          'Ce profil peut convenir, mais certains critères doivent être vérifiés.',
        stars: 3,
        className:
          'recommendation-possible'
      };
    }

    return {
      label:
        'Faible compatibilité',
      description:
        'Ce profil couvre peu de critères essentiels de la mission.',
      stars: 2,
      className:
        'recommendation-low'
    };
  }

  getStarIndexes(): number[] {
    return [1, 2, 3, 4, 5];
  }

  isStarActive(
    star: number,
    score: number
  ): boolean {
    return star <=
      this.getRecommendation(score).stars;
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

  getConfidenceClass(
    confidence: number
  ): string {
    if (confidence >= 85) {
      return 'confidence-high';
    }

    if (confidence >= 65) {
      return 'confidence-good';
    }

    if (confidence >= 45) {
      return 'confidence-medium';
    }

    return 'confidence-low';
  }

  getProgressClass(
    score: number
  ): string {
    if (score >= 80) {
      return 'progress-excellent';
    }

    if (score >= 65) {
      return 'progress-good';
    }

    if (score >= 45) {
      return 'progress-average';
    }

    return 'progress-low';
  }

  viewConsultantProfile(
    consultantId: string
  ): void {
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

  trackMatchResult(
    index: number,
    result: ConsultantMatchResult
  ): string {
    return result.consultantId;
  }

  trackConsultant(
    index: number,
    consultant: Consultant
  ): string {
    return consultant.id;
  }

  trackCriterion(
    index: number,
    criterion: ScoreCriterion
  ): string {
    return criterion.label;
  }

  trackStar(
    index: number,
    star: number
  ): number {
    return star;
  }

  private loadConsultantImage(
    consultant: Consultant
  ): void {
    if (
      !consultant.id ||
      !consultant.profileImageUrl ||
      this.profileImageUrls[
        consultant.id
      ]
    ) {
      return;
    }

    this.consultantService
      .getProfileImage(consultant.id)
      .subscribe({
        next: blob => {
          const currentUrl =
            this.profileImageUrls[
              consultant.id
            ];

          if (currentUrl) {
            URL.revokeObjectURL(
              currentUrl
            );
          }

          this.profileImageUrls = {
            ...this.profileImageUrls,
            [consultant.id]:
              URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.removeProfileImageUrl(
            consultant.id
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

  private normalizeScoreBreakdown(
    breakdown:
      ScoreBreakdown |
      null |
      undefined
  ): ScoreBreakdown {
    return {
      requiredSkillsScore:
        breakdown?.requiredSkillsScore ?? 0,
      preferredSkillsScore:
        breakdown?.preferredSkillsScore ?? 0,
      experienceScore:
        breakdown?.experienceScore ?? 0,
      titleScore:
        breakdown?.titleScore ?? 0,
      locationScore:
        breakdown?.locationScore ?? 0,
      aiScore:
        breakdown?.aiScore ?? 0
    };
  }

  private isRequiredSkillsCriterionAvailable(
    result: ConsultantMatchResult
  ): boolean {
    return (
      result.scoreBreakdown
        .requiredSkillsScore > 0 ||
      result.matchedSkills.length > 0 ||
      result.missingSkills.length > 0
    );
  }

  private isOptionalCriterionAvailable(
    score: number
  ): boolean {
    return score > 0;
  }
}