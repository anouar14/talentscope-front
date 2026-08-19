import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Consultants } from './consultants';

describe('Consultants', () => {
  let component: Consultants;
  let fixture: ComponentFixture<Consultants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consultants]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Consultants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
