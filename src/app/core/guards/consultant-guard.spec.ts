import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { consultantGuard } from './consultant-guard';

describe('consultantGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => consultantGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
