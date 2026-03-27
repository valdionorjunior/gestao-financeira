import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

describe('authGuard', () => {
  let isAuthenticatedValue = false;

  const mockAuthService = {
    isAuthenticated: signal(false) as ReturnType<typeof signal<boolean>>,
  };

  function updateAuth(value: boolean) {
    isAuthenticatedValue = value;
    // We use a computed-like approach: override with a new signal per test
    (mockAuthService as any).isAuthenticated = () => isAuthenticatedValue;
  }

  beforeEach(() => {
    updateAuth(false);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  it('returns true when user is authenticated', () => {
    updateAuth(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('returns UrlTree redirecting to /login when not authenticated', () => {
    updateAuth(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
