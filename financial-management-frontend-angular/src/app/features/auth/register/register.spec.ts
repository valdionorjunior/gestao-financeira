import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient }          from '@angular/common/http';
import { provideHttpClientTesting }   from '@angular/common/http/testing';
import { provideRouter, Router }      from '@angular/router';
import { ReactiveFormsModule }        from '@angular/forms';
import { MessageService }             from 'primeng/api';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegisterComponent }          from './register';
import { AuthService }                from '../../../core/services/auth.service';
import { of, throwError }             from 'rxjs';

describe('RegisterComponent – integração', () => {
  let fixture:   ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authService: AuthService;
  let router: Router;

  const fakeResp = {
    accessToken:  'token-123',
    refreshToken: 'refresh-456',
    user: { id: 'u2', email: 'nova@conta.com', firstName: 'Ana', lastName: 'Lima', role: 'TITULAR' as const },
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports:   [RegisterComponent, ReactiveFormsModule],
      providers: [
        MessageService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', component: RegisterComponent }]),
      ],
    }).compileComponents();

    fixture     = TestBed.createComponent(RegisterComponent);
    component   = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router      = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('has all required form controls', () => {
    expect(component.form.contains('firstName')).toBe(true);
    expect(component.form.contains('lastName')).toBe(true);
    expect(component.form.contains('email')).toBe(true);
    expect(component.form.contains('password')).toBe(true);
    expect(component.form.contains('lgpdConsent')).toBe(true);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('form is invalid when empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('form is valid with all required fields', () => {
    component.form.setValue({
      firstName:   'Ana',
      lastName:    'Lima',
      email:       'ana@example.com',
      password:    'Senha@123',
      lgpdConsent: true,
    });
    expect(component.form.valid).toBe(true);
  });

  it('password control is invalid if shorter than 6 chars', () => {
    component.form.patchValue({ password: '123' });
    expect(component.form.controls.password.valid).toBe(false);
  });

  it('lgpdConsent must be true for form to be valid', () => {
    component.form.setValue({
      firstName:   'Ana',
      lastName:    'Lima',
      email:       'ana@example.com',
      password:    'Senha@123',
      lgpdConsent: false,
    });
    expect(component.form.valid).toBe(false);
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it('does NOT call authService.register when form is invalid', () => {
    const spy = vi.spyOn(authService, 'register');
    component.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls authService.register with correct payload on valid submit', () => {
    const regSpy = vi.spyOn(authService, 'register').mockReturnValue(of(fakeResp));

    component.form.setValue({
      firstName:   'Ana',
      lastName:    'Lima',
      email:       'ana@example.com',
      password:    'Senha@123',
      lgpdConsent: true,
    });
    component.submit();

    expect(regSpy).toHaveBeenCalledWith({
      firstName:   'Ana',
      lastName:    'Lima',
      email:       'ana@example.com',
      password:    'Senha@123',
      lgpdConsent: true,
    });
  });

  it('navigates to /dashboard after successful registration', () => {
    vi.spyOn(authService, 'register').mockReturnValue(of(fakeResp));
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.setValue({
      firstName:   'Ana', lastName: 'Lima', email: 'ana@example.com',
      password:    'Senha@123', lgpdConsent: true,
    });
    component.submit();

    expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('sets error signal on registration failure', () => {
    vi.spyOn(authService, 'register').mockReturnValue(
      throwError(() => ({ error: { message: 'E-mail já cadastrado' } })),
    );

    component.form.setValue({
      firstName:   'X', lastName: 'Y', email: 'dup@example.com',
      password:    'Senha@123', lgpdConsent: true,
    });
    component.submit();

    expect(component.error()).toBeTruthy();
  });
});
