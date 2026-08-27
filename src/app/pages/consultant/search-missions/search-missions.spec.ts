import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMissions } from './search-missions';

describe('SearchMissions', () => {
  let component: SearchMissions;
  let fixture: ComponentFixture<SearchMissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchMissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchMissions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
