import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, LoginResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user         = signal<User | null>(this.loadUser());
  private _accessToken  = signal<string | null>(localStorage.getItem('access_token'));
  private _refreshToken = signal<string | null>(localStorage.getItem('refresh_token'));

  readonly user           = this._user.asReadonly();
  readonly accessToken    = this._accessToken.asReadonly();
  readonly refreshToken   = this._refreshToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken() && !!this._user());

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private persist(data: LoginResponse) {
    localStorage.setItem('access_token',  data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    this._accessToken.set(data.accessToken);
    this._refreshToken.set(data.refreshToken);
    this._user.set(data.user);
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(data => this.persist(data)));
  }

  register(payload: { email: string; password: string; firstName: string; lastName: string; lgpdConsent: boolean }) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap(data => this.persist(data)));
  }

  refresh() {
    const rt = this._refreshToken();
    if (!rt) return throwError(() => new Error('No refresh token'));
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt })
      .pipe(tap(data => this.persist(data)));
  }

  logout() {
    const rt = this._refreshToken();
    const call$ = rt
      ? this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: rt }).pipe(catchError(() => throwError(() => null)))
      : throwError(() => null);

    call$.subscribe({ error: () => {} });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token',  accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
  }
}

