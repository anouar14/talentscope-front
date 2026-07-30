import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Invitation } from '../../../core/models/invitation';
import { Invitations } from './invitations';

describe('Invitations', () => {
  let component: Invitations;
  let fixture: ComponentFixture<Invitations>;
  let httpTestingController: HttpTestingController;

  const invitation: Invitation = {
    id: 'invitation-1',
    companyId: 'company-1',
    companyName: 'Focus Corporation',
    consultantId: 'consultant-1',
    consultantName: 'Mahdi Hamdeni',
    consultantTitle: 'Développeur Java',
    subject: 'Mission Spring Boot',
    message: 'Nous souhaitons vous proposer une mission.',
    status: 'PENDING',
    createdAt: '2026-07-30T10:00:00',
    respondedAt: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Invitations],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Invitations);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load consultant invitations', () => {
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'http://localhost:8080/api/invitations/consultant'
    );

    expect(request.request.method).toBe('GET');

    request.flush([invitation]);

    expect(component.invitations.length).toBe(1);
    expect(component.invitations[0].companyName).toBe('Focus Corporation');
    expect(component.loading).toBeFalse();
  });

  it('should filter invitations by status', () => {
    component.invitations = [
      invitation,
      {
        ...invitation,
        id: 'invitation-2',
        status: 'REJECTED'
      }
    ];

    component.filterByStatus('PENDING');

    expect(component.filteredInvitations.length).toBe(1);
    expect(component.filteredInvitations[0].status).toBe('PENDING');
  });

  it('should filter invitations by search term', () => {
    component.invitations = [invitation];
    component.searchTerm = 'spring boot';

    expect(component.filteredInvitations.length).toBe(1);

    component.searchTerm = 'angular';

    expect(component.filteredInvitations.length).toBe(0);
  });
});