import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionOfferApplications } from './mission-offer-applications';

describe('MissionOfferApplications', () => {
  let component: MissionOfferApplications;
  let fixture: ComponentFixture<MissionOfferApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionOfferApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(
      MissionOfferApplications
    );

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});