import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.models';

const TOKEN_KEY = 'ga.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly tokenState = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<AuthUser | null>(null);

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  get token(): string | null {
    return this.tokenState();
  }

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.startSession(response.accessToken, response.user)),
      map((response) => response.user),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    if (!this.tokenState()) {
      return of(null);
    }

    return this.http.get<AuthUser>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => this.userState.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): void {
    this.http
      .post<void>(`${this.apiUrl}/auth/logout`, {})
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.clearSession();
        void this.router.navigate(['/login']);
      });
  }

  handleExpiredSession(): void {
    this.clearSession();
    void this.router.navigate(['/login'], { queryParams: { expired: true } });
  }

  private startSession(token: string, user: AuthUser): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    this.tokenState.set(token);
    this.userState.set(user);
  }

  private clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }
}
