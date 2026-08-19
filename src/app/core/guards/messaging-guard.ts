import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { Auth } from '../services/auth';

export const messagingGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (
    authService.hasRole('COMPANY') ||
    authService.hasRole('CONSULTANT')
  ) {
    return true;
  }

  if (authService.hasRole('ADMIN')) {
    return router.createUrlTree([
      '/admin/dashboard'
    ]);
  }

  return router.createUrlTree(['/']);
};