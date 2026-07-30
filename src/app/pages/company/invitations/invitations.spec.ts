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
    message: 'Nous souhaitons vous proposer une mission.',
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
    component.searchTerm = 'mahdi';

    expect(component.filteredInvitations.length).toBe(1);

    component.searchTerm = 'angular';

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
});