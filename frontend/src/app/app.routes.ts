import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  guestGuard,
  roleGuard,
} from './core/auth/auth.guards';
import { RoleCode } from './core/models/auth.models';
//Sirve para el ruteo de las dizstintas rutas del sistema
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'archivos' },
      {
        path: 'archivos',
        loadComponent: () =>
          import('./features/files/files-page').then((m) => m.FilesPage),
      },
      {
        path: 'historial',
        canActivate: [roleGuard(RoleCode.MANAGER, RoleCode.ADMIN)],
        loadComponent: () =>
          import('./features/audit/audit-page').then((m) => m.AuditPage),
      },
      {
        path: 'administracion',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin-layout').then((m) => m.AdminLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./features/admin/users/users-page').then(
                (m) => m.UsersPage,
              ),
          },
          {
            path: 'areas',
            loadComponent: () =>
              import('./features/admin/areas/areas-page').then(
                (m) => m.AreasPage,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
