import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Invitation } from '../../../core/models/invitation';
import { CompanyInvitations } from './invitations';

describe('CompanyInvitations', () => {
  let component: CompanyInvitations;
  let fixture: ComponentFixture<CompanyInvitations>;
  let httpTestingController: HttpTestingController;

  const invitation: Invitation = {
    id: 'invitation-1',
    companyId: 'company-1',
    companyName: 'Focus Corporation',
    consultantId: 'consultant-1',
    consultantName: 'Anouar Hichri',
    consultantTitle: 'Développeur Java',
    subject: 'Mission Spring Boot',
    message: 'Développement et maintenance d’une plateforme métier.',
    startDate: '2026-09-01',
    endDate: '2027-02-28',
    contractType: 'FREELANCE',
    workMode: 'HYBRID',
    location: 'Tunis',
    salary: 3500,
    technologies: ['Java', 'Spring Boot', 'Angular'],
    notes: 'Présence sur site deux jours par semaine.',
    status: 'PENDING',
    createdAt: '2026-07-30T10:00:00',
    respondedAt: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyInvitations],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyInvitations);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load company invitations', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/invitations/company'
    );

    expect(request.request.method).toBe('GET');

    request.flush([invitation]);

    expect(component.invitations.length).toBe(1);
    expect(component.invitations[0].consultantName).toBe('Anouar Hichri');
    expect(component.invitations[0].technologies.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should filter invitations by status', () => {
    component.invitations = [
      invitation,
      {
        ...invitation,
        id: 'invitation-2',
        status: 'ACCEPTED'
      }
    ];

    component.filterByStatus('ACCEPTED');

    expect(component.filteredInvitations.length).toBe(1);
    expect(component.filteredInvitations[0].status).toBe('ACCEPTED');
  });

  it('should search invitations by consultant name', () => {
    component.invitations = [invitation];
    component.searchTerm = 'anouar';

    expect(component.filteredInvitations.length).toBe(1);

    component.searchTerm = 'mahdi';

    expect(component.filteredInvitations.length).toBe(0);
  });

  it('should search invitations by technology', () => {
    component.invitations = [invitation];
    component.searchTerm = 'spring boot';

    expect(component.filteredInvitations.length).toBe(1);

    component.searchTerm = 'python';

    expect(component.filteredInvitations.length).toBe(0);
  });

  it('should count invitations by status', () => {
    component.invitations = [
      invitation,
      {
        ...invitation,
        id: 'invitation-2',
        status: 'ACCEPTED'
      },
      {
        ...invitation,
        id: 'invitation-3',
        status: 'REJECTED'
      }
    ];

    expect(component.pendingCount).toBe(1);
    expect(component.acceptedCount).toBe(1);
    expect(component.rejectedCount).toBe(1);
  });

  it('should format contract type and work mode labels', () => {
    expect(component.getContractTypeLabel('FREELANCE')).toBe('Freelance');
    expect(component.getWorkModeLabel('HYBRID')).toBe('Hybride');
  });

  it('should format salary', () => {
    expect(component.getSalaryLabel(3500)).toContain('3');
    expect(component.getSalaryLabel(null)).toBe('Non renseignée');
  });
});