import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleCode } from '../models/auth.models';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).createUrlTree(['/']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return (
    auth.user()?.roleCode === RoleCode.ADMIN ||
    inject(Router).createUrlTree(['/archivos'])
  );
};
