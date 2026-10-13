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

export function roleGuard(...roles: RoleCode[]): CanActivateFn {
  return () => {
    const role = inject(AuthService).user()?.roleCode;
    return (
      (role !== undefined && roles.includes(role)) ||
      inject(Router).createUrlTree(['/archivos'])
    );
  };
}

export const adminGuard: CanActivateFn = roleGuard(RoleCode.ADMIN);
