import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultantDetail } from './consultant-detail';

describe('ConsultantDetail', () => {
  let component: ConsultantDetail;
  let fixture: ComponentFixture<ConsultantDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultantDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultantDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
