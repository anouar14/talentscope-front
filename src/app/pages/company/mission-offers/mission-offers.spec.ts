import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionOffers } from './mission-offers';

describe('MissionOffers', () => {
  let component: MissionOffers;
  let fixture: ComponentFixture<MissionOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionOffers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionOffers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
