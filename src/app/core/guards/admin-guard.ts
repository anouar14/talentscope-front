import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.hasRole('ADMIN')) {
    if (authService.hasRole('COMPANY')) {
      return router.createUrlTree([
        '/company/dashboard'
      ]);
    }

    if (authService.hasRole('CONSULTANT')) {
      return router.createUrlTree([
        '/consultant/dashboard'
      ]);
    }

    return router.createUrlTree(['/']);
  }

  return true;
};