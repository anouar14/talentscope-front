import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionDetail } from './mission-detail';

describe('MissionDetail', () => {
  let component: MissionDetail;
  let fixture: ComponentFixture<MissionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
