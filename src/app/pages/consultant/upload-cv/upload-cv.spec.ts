import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCv } from './upload-cv';

describe('UploadCv', () => {
  let component: UploadCv;
  let fixture: ComponentFixture<UploadCv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadCv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadCv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
