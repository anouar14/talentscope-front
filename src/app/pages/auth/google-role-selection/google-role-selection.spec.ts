import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleRoleSelection } from './google-role-selection';

describe('GoogleRoleSelection', () => {
  let component: GoogleRoleSelection;
  let fixture: ComponentFixture<GoogleRoleSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleRoleSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleRoleSelection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
