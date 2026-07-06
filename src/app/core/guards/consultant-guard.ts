import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const consultantGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.hasRole('CONSULTANT')) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};