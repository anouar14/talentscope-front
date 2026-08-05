import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Company } from '../../../core/models/company';
import { CompanyDashboard } from './dashboard';

describe('CompanyDashboard', () => {
  let component: CompanyDashboard;
  let fixture: ComponentFixture<CompanyDashboard>;
  let httpTestingController: HttpTestingController;

  const company: Company = {
    id: 'company-1',
    userId: 'user-1',
    companyName: 'Focus Corporation',
    sector: 'Technologies',
    location: 'Tunis',
    website: 'https://example.com',
    description: 'Entreprise technologique'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyDashboard);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data', () => {
    fixture.detectChanges();

    const profileRequest = httpTestingController.expectOne(
      'http://localhost:8080/api/companies/me'
    );

    const invitationsRequest = httpTestingController.expectOne(
      'http://localhost:8080/api/invitations/company'
    );

    const missionsRequest = httpTestingController.expectOne(
      'http://localhost:8080/api/missions/company/me'
    );

    profileRequest.flush(company);
    invitationsRequest.flush([]);
    missionsRequest.flush([]);

    expect(component.company?.companyName).toBe('Focus Corporation');
    expect(component.totalInvitations).toBe(0);
    expect(component.activeMissions).toBe(0);
    expect(component.loading).toBeFalse();
  });
});