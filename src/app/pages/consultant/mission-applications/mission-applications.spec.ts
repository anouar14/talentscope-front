import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionApplications } from './mission-applications';

describe('MissionApplications', () => {
  let component: MissionApplications;
  let fixture: ComponentFixture<MissionApplications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionApplications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionApplications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
