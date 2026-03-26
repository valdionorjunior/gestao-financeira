import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const fakeLoginResp = {
  accessToken:  'access-123',
  refreshToken: 'refresh-456',
  user: { id: 'u1', email: 'test@example.com', firstName: 'Maria', lastName: 'Souza', role: 'TITULAR' },
};

const routes: Routes = [{ path: 'login', component: {} as any }];

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
      ],
    });

    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initial state: isAuthenticated should be false when localStorage is empty', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('login() should POST to /auth/login and persist tokens', () => {
    let result: any;
    service.login('test@example.com', 'Pass@123').subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'Pass@123' });
    req.flush(fakeLoginResp);

    expect(result.accessToken).toBe('access-123');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.email).toBe('test@example.com');
    expect(localStorage.getItem('access_token')).toBe('access-123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-456');
  });

  it('register() should POST to /auth/register and persist tokens', () => {
    let result: any;
    service.register({ email: 'new@user.com', password: 'Pass@123', firstName: 'João', lastName: 'Silva', lgpdConsent: true })
      .subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.lgpdConsent).toBe(true);
    req.flush(fakeLoginResp);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('setTokens() should update tokens in localStorage and signals', () => {
    service.setTokens('new-access', 'new-refresh');
    expect(service.accessToken()).toBe('new-access');
    expect(service.refreshToken()).toBe('new-refresh');
    expect(localStorage.getItem('access_token')).toBe('new-access');
  });

  it('logout() should clear tokens and user', () => {
    // First login
    service.login('test@example.com', 'Pass@123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(fakeLoginResp);

    service.logout();
    // Optionally flush the logout POST
    const logoutReqs = httpMock.match(`${environment.apiUrl}/auth/logout`);
    logoutReqs.forEach(r => r.flush({}));

    expect(service.user()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
