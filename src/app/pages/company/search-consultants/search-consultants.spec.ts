import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ConsultantMatchResult,
  MatchingResponse
} from '../../../core/services/company';
import { SearchConsultants } from './search-consultants';

describe('SearchConsultants', () => {
  let component: SearchConsultants;
  let fixture: ComponentFixture<SearchConsultants>;
  let httpTestingController: HttpTestingController;

  const matchingResult: ConsultantMatchResult = {
    consultantId: 'consultant-1',
    firstName: 'Anouar',
    lastName: 'Hichri',
    title: 'Développeur Java',
    location: 'Tunis',
    experienceYears: 4,
    available: true,
    score: 84,
    confidence: 91,
    scoreBreakdown: {
      requiredSkillsScore: 100,
      preferredSkillsScore: 50,
      experienceScore: 100,
      titleScore: 67,
      locationScore: 100,
      aiScore: 86
    },
    matchedSkills: [
      'Java',
      'Spring Boot'
    ],
    missingSkills: [
      'Docker'
    ],
    strengths: [
      'Bonne maîtrise des compétences backend obligatoires.',
      'Expérience conforme au niveau demandé.'
    ],
    weaknesses: [
      'Docker n’est pas renseigné dans le profil.'
    ],
    explanation:
      'Le profil présente une bonne compatibilité globale avec le poste.'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchConsultants],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchConsultants);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load consultants on initialization', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/consultants'
    );

    expect(request.request.method).toBe('GET');

    request.flush([]);

    expect(component.loading).toBeFalse();
    expect(component.consultants).toEqual([]);
  });

  it('should launch matching and normalize results', () => {
    component.jobDescription =
      'Nous recherchons un développeur Java Spring Boot expérimenté.';

    component.launchMatching();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/companies/matching'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body.jobDescription).toContain('Java');

    const response: MatchingResponse = {
      jobDescription: component.jobDescription,
      analyzedConsultants: 1,
      results: [matchingResult]
    };

    request.flush(response);

    expect(component.matchingExecuted).toBeTrue();
    expect(component.matchingLoading).toBeFalse();
    expect(component.analyzedConsultants).toBe(1);
    expect(component.matchingResults.length).toBe(1);
    expect(component.matchingResults[0].confidence).toBe(91);
  });

  it('should expose score criteria', () => {
    const criteria = component.getScoreCriteria(matchingResult);

    expect(criteria.length).toBe(6);
    expect(criteria[0].label).toBe(
      'Compétences obligatoires'
    );
    expect(criteria[0].score).toBe(100);
    expect(criteria[5].score).toBe(86);
  });

  it('should reject a short job description', () => {
    component.jobDescription = 'Java';

    component.launchMatching();

    expect(component.matchingErrorMessage).toContain(
      'au moins 20 caractères'
    );

    expect(component.matchingLoading).toBeFalse();
  });

  it('should return confidence labels', () => {
    expect(component.getConfidenceLabel(90)).toBe(
      'Analyse très fiable'
    );

    expect(component.getConfidenceLabel(70)).toBe(
      'Analyse fiable'
    );

    expect(component.getConfidenceLabel(50)).toBe(
      'Fiabilité moyenne'
    );

    expect(component.getConfidenceLabel(30)).toBe(
      'Données insuffisantes'
    );
  });

  it('should return an excellent recommendation', () => {
    const recommendation = component.getRecommendation(90);

    expect(recommendation.label).toBe('Excellent match');
    expect(recommendation.stars).toBe(5);
    expect(recommendation.className).toBe(
      'recommendation-excellent'
    );
  });

  it('should return a recommended profile', () => {
    const recommendation = component.getRecommendation(72);

    expect(recommendation.label).toBe('Profil recommandé');
    expect(recommendation.stars).toBe(4);
    expect(recommendation.className).toBe(
      'recommendation-recommended'
    );
  });

  it('should return a possible match', () => {
    const recommendation = component.getRecommendation(55);

    expect(recommendation.label).toBe(
      'Compatibilité possible'
    );

    expect(recommendation.stars).toBe(3);
    expect(recommendation.className).toBe(
      'recommendation-possible'
    );
  });

  it('should return a low compatibility level', () => {
    const recommendation = component.getRecommendation(30);

    expect(recommendation.label).toBe(
      'Faible compatibilité'
    );

    expect(recommendation.stars).toBe(2);
    expect(recommendation.className).toBe(
      'recommendation-low'
    );
  });

  it('should activate stars according to the recommendation', () => {
    expect(component.isStarActive(4, 72)).toBeTrue();
    expect(component.isStarActive(5, 72)).toBeFalse();
  });

  it('should return five star indexes', () => {
    expect(component.getStarIndexes()).toEqual([
      1,
      2,
      3,
      4,
      5
    ]);
  });
});