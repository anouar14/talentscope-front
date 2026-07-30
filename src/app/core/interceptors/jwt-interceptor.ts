import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/google'
  ];

  const isPublicRequest = publicEndpoints.some(endpoint =>
    req.url.includes(endpoint)
  );

  if (token && !isPublicRequest) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(clonedRequest);
  }

  return next(req);
};