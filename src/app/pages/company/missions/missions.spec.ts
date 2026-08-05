import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Mission } from '../../../core/models/mission';
import { CompanyMissions } from './missions';

describe('CompanyMissions', () => {
  let component: CompanyMissions;
  let fixture: ComponentFixture<CompanyMissions>;
  let httpTestingController: HttpTestingController;

  const mission: Mission = {
    id: 'mission-1',
    invitationId: 'invitation-1',
    companyId: 'company-1',
    companyName: 'Focus Corporation',
    consultantId: 'consultant-1',
    consultantName: 'Anouar Hichri',
    consultantTitle: 'Développeur Java',
    title: 'Mission Spring Boot',
    description: 'Développement d’une plateforme métier.',
    startDate: '2026-09-01',
    endDate: '2027-02-28',
    contractType: 'FREELANCE',
    workMode: 'HYBRID',
    location: 'Tunis',
    salary: 3500,
    technologies: ['Java', 'Spring Boot', 'Angular'],
    notes: 'Présence sur site deux jours par semaine.',
    status: 'ACTIVE',
    createdAt: '2026-08-01T10:00:00',
    updatedAt: '2026-08-01T10:00:00'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyMissions],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyMissions);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load company missions', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/missions/company/me'
    );

    expect(request.request.method).toBe('GET');

    request.flush([mission]);

    expect(component.missions.length).toBe(1);
    expect(component.missions[0].title).toBe('Mission Spring Boot');
    expect(component.activeMissionCount).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should filter missions by status', () => {
    component.missions = [
      mission,
      {
        ...mission,
        id: 'mission-2',
        status: 'COMPLETED'
      }
    ];

    component.filterByStatus('COMPLETED');

    expect(component.filteredMissions.length).toBe(1);
    expect(component.filteredMissions[0].status).toBe('COMPLETED');
  });

  it('should search missions by technology', () => {
    component.missions = [mission];
    component.searchTerm = 'spring boot';

    expect(component.filteredMissions.length).toBe(1);

    component.searchTerm = 'python';

    expect(component.filteredMissions.length).toBe(0);
  });
});