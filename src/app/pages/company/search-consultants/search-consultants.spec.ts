import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchConsultants } from './search-consultants';

describe('SearchConsultants', () => {
  let component: SearchConsultants;
  let fixture: ComponentFixture<SearchConsultants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchConsultants]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchConsultants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
