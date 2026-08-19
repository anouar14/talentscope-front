import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Messaging } from './messaging';

describe('Messaging', () => {
  let component: Messaging;
  let fixture: ComponentFixture<Messaging>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Messaging]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Messaging);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
