import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient }          from '@angular/common/http';
import { provideHttpClientTesting }   from '@angular/common/http/testing';
import { provideRouter }              from '@angular/router';
import { MessageService }             from 'primeng/api';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError }             from 'rxjs';
import { DashboardComponent }         from './dashboard';
import { FinanceService }             from '../../core/services/finance.service';

const mockDashboard = {
  totalBalance:    10000,
  monthlyIncome:   5000,
  monthlyExpenses: 3000,
  monthlySavings:  2000,
  budgetAlerts:    [],
};

const mockPaginatedTx = { data: [], total: 0, page: 1, limit: 5, totalPages: 0 };

function buildFinanceMock(): FinanceService {
  return {
    getDashboard:    vi.fn(() => of(mockDashboard)),
    getTransactions: vi.fn(() => of(mockPaginatedTx)),
    getInsights:     vi.fn(() => of([])),
    getCashFlow:     vi.fn(() => of([])),
    getPredict:      vi.fn(() => of({ history: [], predictedNextMonth: 0 })),
    getAccounts:     vi.fn(() => of([])),
    getBudgets:      vi.fn(() => of([])),
    getGoals:        vi.fn(() => of([])),
  } as unknown as FinanceService;
}

describe('DashboardComponent – integração', () => {
  let fixture:     ComponentFixture<DashboardComponent>;
  let component:   DashboardComponent;
  let financeMock: FinanceService;

  beforeEach(async () => {
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'u1', email: 'test@test.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN',
    }));

    financeMock = buildFinanceMock();

    await TestBed.configureTestingModule({
      imports:   [DashboardComponent],
      providers: [
        MessageService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FinanceService, useValue: financeMock },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with loading() === true before detectChanges', () => {
    expect(component.loading()).toBe(true);
  });

  it('loads dashboard summary via FinanceService.getDashboard', () => {
    fixture.detectChanges();
    expect((financeMock.getDashboard as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    expect(component.summary()).toEqual(mockDashboard);
    expect(component.loading()).toBe(false);
  });

  it('loads recent transactions on init', () => {
    fixture.detectChanges();
    expect((financeMock.getTransactions as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ limit: 5 });
  });

  it('sets loading to false on getDashboard error', () => {
    (financeMock.getDashboard as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('Server error')),
    );
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });

  it('shows the user first name in the template', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Admin');
  });
});
