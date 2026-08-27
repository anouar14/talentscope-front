import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionOfferDetail } from './mission-offer-detail';

describe('MissionOfferDetail', () => {
  let component: MissionOfferDetail;
  let fixture: ComponentFixture<MissionOfferDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionOfferDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionOfferDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
