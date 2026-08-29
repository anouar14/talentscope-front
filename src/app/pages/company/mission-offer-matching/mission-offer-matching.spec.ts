import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionOfferMatching } from './mission-offer-matching';

describe('MissionOfferMatching', () => {
  let component: MissionOfferMatching;
  let fixture: ComponentFixture<MissionOfferMatching>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionOfferMatching]
    })
      .compileComponents();

    fixture = TestBed.createComponent(
      MissionOfferMatching
    );

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});