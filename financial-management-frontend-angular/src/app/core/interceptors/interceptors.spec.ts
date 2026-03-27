import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { jwtInterceptor } from './jwt.interceptor';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

// ── JWT Interceptor tests ─────────────────────────────────────────────────────

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        MessageService,
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('adds Authorization header when access_token exists in localStorage', () => {
    localStorage.setItem('access_token', 'test-jwt-token');

    http.get('/api/accounts').subscribe();

    const req = httpMock.expectOne('/api/accounts');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush([]);
  });

  it('does NOT add Authorization header when no token in localStorage', () => {
    http.get('/api/accounts').subscribe();

    const req = httpMock.expectOne('/api/accounts');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });

  it('passes request through unchanged when no token', () => {
    http.get('/api/v1/accounts').subscribe();
    const req = httpMock.expectOne('/api/v1/accounts');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});

// ── Error Interceptor tests ───────────────────────────────────────────────────

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessageService,
        AuthService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http           = TestBed.inject(HttpClient);
    httpMock       = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls MessageService.add on non-401 error', () => {
    const addSpy = vi.spyOn(messageService, 'add');

    http.get('/api/v1/budgets').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/budgets');
    req.flush({ message: 'Recurso não encontrado' }, { status: 404, statusText: 'Not Found' });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' }),
    );
  });

  it('does NOT call MessageService.add on 401 error', () => {
    const addSpy = vi.spyOn(messageService, 'add');

    http.get('/api/v1/transactions').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/transactions');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('propagates the error to subscribers', () => {
    let capturedError: HttpErrorResponse | undefined;

    http.get('/api/v1/goals').subscribe({
      error: (err: HttpErrorResponse) => { capturedError = err; },
    });

    const req = httpMock.expectOne('/api/v1/goals');
    req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(capturedError?.status).toBe(500);
  });
});
