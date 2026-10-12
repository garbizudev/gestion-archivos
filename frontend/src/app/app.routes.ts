import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
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
    ],
  },
  { path: '**', redirectTo: '' },
];
