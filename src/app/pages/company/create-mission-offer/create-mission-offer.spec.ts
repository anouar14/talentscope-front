import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMissionOffer } from './create-mission-offer';

describe('CreateMissionOffer', () => {
  let component: CreateMissionOffer;
  let fixture: ComponentFixture<CreateMissionOffer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMissionOffer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMissionOffer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
