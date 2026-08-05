import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Consultant } from '../../../core/models/consultant';
import { ConsultantDashboard } from './dashboard';

describe('ConsultantDashboard', () => {
  let component: ConsultantDashboard;
  let fixture: ComponentFixture<ConsultantDashboard>;
  let httpTestingController: HttpTestingController;

  const consultant: Consultant = {
    id: 'consultant-1',
    userId: 'user-1',
    firstName: 'Mahdi',
    lastName: 'Hamdeni',
    title: 'Développeur Java',
    skills: ['Java', 'Spring Boot', 'Angular'],
    cvUrl: 'uploads/cvs/cv.pdf',
    experienceYears: 3,
    location: 'Tunis',
    available: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultantDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultantDashboard);
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
      'http://localhost:8080/api/consultants/me'
    );

    const invitationsRequest = httpTestingController.expectOne(
      'http://localhost:8080/api/invitations/consultant'
    );

    const missionsRequest = httpTestingController.expectOne(
      'http://localhost:8080/api/missions/consultant/me'
    );

    profileRequest.flush(consultant);
    invitationsRequest.flush([]);
    missionsRequest.flush([]);

    expect(component.consultant?.firstName).toBe('Mahdi');
    expect(component.totalInvitations).toBe(0);
    expect(component.activeMissions).toBe(0);
    expect(component.profileCompletion).toBe(100);
    expect(component.loading).toBeFalse();
  });

  it('should calculate profile completion', () => {
    const incompleteConsultant: Consultant = {
      ...consultant,
      title: '',
      location: '',
      cvUrl: '',
      skills: []
    };

    const completion = component.calculateCompletion(
      incompleteConsultant
    );

    expect(completion).toBeLessThan(100);
  });
});