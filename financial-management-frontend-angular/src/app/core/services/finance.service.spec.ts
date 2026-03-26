import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FinanceService } from './finance.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

describe('FinanceService', () => {
  let service: FinanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FinanceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(FinanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── Accounts ──────────────────────────────────────────────────────────────

  it('getAccounts() should GET /accounts', () => {
    service.getAccounts().subscribe();
    httpMock.expectOne(`${API}/accounts`).flush([]);
  });

  it('createAccount() should POST /accounts', () => {
    const body = { name: 'Nubank', type: 'CHECKING' };
    service.createAccount(body as any).subscribe();
    const req = httpMock.expectOne(`${API}/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'acc-1', ...body });
  });

  it('updateAccount() should PATCH /accounts/:id', () => {
    service.updateAccount('acc-1', { name: 'Itaú' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/accounts/acc-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deleteAccount() should DELETE /accounts/:id', () => {
    service.deleteAccount('acc-1').subscribe();
    const req = httpMock.expectOne(`${API}/accounts/acc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Categories ────────────────────────────────────────────────────────────

  it('getCategories() should GET /categories', () => {
    service.getCategories().subscribe();
    httpMock.expectOne(`${API}/categories`).flush([]);
  });

  it('createCategory() should POST /categories', () => {
    service.createCategory({ name: 'Alimentação', type: 'EXPENSE' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/categories`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'cat-1' });
  });

  it('updateCategory() should PUT /categories/:id', () => {
    service.updateCategory('cat-1', { name: 'Comida' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/categories/cat-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteCategory() should DELETE /categories/:id', () => {
    service.deleteCategory('cat-1').subscribe();
    const req = httpMock.expectOne(`${API}/categories/cat-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  it('getTransactions() should GET /transactions without filters', () => {
    service.getTransactions().subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/transactions`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0 });
  });

  it('getTransactions() should include query params when filters provided', () => {
    service.getTransactions({ page: 2, limit: 10, type: 'EXPENSE' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/transactions`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('type')).toBe('EXPENSE');
    req.flush({ data: [], total: 0 });
  });

  it('createTransaction() should POST /transactions', () => {
    service.createTransaction({ amount: 150, type: 'EXPENSE' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/transactions`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'txn-1' });
  });

  it('updateTransaction() should PUT /transactions/:id', () => {
    service.updateTransaction('txn-1', { description: 'Mercado' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/transactions/txn-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  // ── Budgets ───────────────────────────────────────────────────────────────

  it('getBudgets() should GET /budgets', () => {
    service.getBudgets().subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/budgets`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createBudget() should POST /budgets', () => {
    service.createBudget({ amount: 1000, categoryId: 'cat-1' } as any).subscribe();
    const req = httpMock.expectOne(`${API}/budgets`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'bud-1' });
  });

  it('updateBudget() should PUT /budgets/:id', () => {
    service.updateBudget('bud-1', { amount: 1500 } as any).subscribe();
    const req = httpMock.expectOne(`${API}/budgets/bud-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteBudget() should DELETE /budgets/:id', () => {
    service.deleteBudget('bud-1').subscribe();
    const req = httpMock.expectOne(`${API}/budgets/bud-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Goals ─────────────────────────────────────────────────────────────────

  it('getGoals() should GET /goals', () => {
    service.getGoals().subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/goals`);
    req.flush([]);
  });

  it('addContribution() should POST /goals/:id/contributions', () => {
    service.addContribution('goal-1', 500).subscribe();
    const req = httpMock.expectOne(`${API}/goals/goal-1/contributions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 500 });
    req.flush({ id: 'contrib-1' });
  });

  // ── Reports ───────────────────────────────────────────────────────────────

  it('getDashboard() should GET /reports/dashboard', () => {
    service.getDashboard().subscribe();
    httpMock.expectOne(`${API}/reports/dashboard`).flush({});
  });

  it('getCashFlow() should GET /reports/cash-flow with date params', () => {
    service.getCashFlow({ startDate: '2026-01-01', endDate: '2026-12-31' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/reports/cash-flow`);
    expect(req.request.params.get('startDate')).toBe('2026-01-01');
    expect(req.request.params.get('endDate')).toBe('2026-12-31');
    req.flush({ cashFlow: [] });
  });

  it('getCashFlow() without params should send no query string', () => {
    service.getCashFlow().subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/reports/cash-flow`);
    expect(req.request.params.keys()).toHaveLength(0);
    req.flush({ cashFlow: [] });
  });

  it('getMonthlySummary() should GET /reports/monthly with year and month', () => {
    service.getMonthlySummary(2026, 3).subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/reports/monthly`);
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('3');
    req.flush({});
  });

  it('getBudgetReport() should GET /reports/budgets', () => {
    service.getBudgetReport().subscribe();
    httpMock.expectOne(`${API}/reports/budgets`).flush([]);
  });

  // ── AI ────────────────────────────────────────────────────────────────────

  it('askAi() should POST /ai/chat with message', () => {
    service.askAi('qual meu saldo?').subscribe();
    const req = httpMock.expectOne(`${API}/ai/chat`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.message).toBe('qual meu saldo?');
    req.flush({ response: 'Seu saldo é R$ 5000.' });
  });

  it('getPredict() should GET /ai/predict', () => {
    service.getPredict().subscribe();
    httpMock.expectOne(`${API}/ai/predict`).flush({ history: [], predictedNextMonth: 2000 });
  });

  // ── Bank Statements ───────────────────────────────────────────────────────

  it('getStatements() should GET /bank-statements', () => {
    service.getStatements().subscribe();
    httpMock.expectOne(`${API}/bank-statements`).flush([]);
  });

  it('uploadStatement() should POST /bank-statements/import/:accountId as multipart', () => {
    const file = new File(['csv-data'], 'statement.csv', { type: 'text/csv' });
    service.uploadStatement('acc-1', file).subscribe();
    const req = httpMock.expectOne(`${API}/bank-statements/import/acc-1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ id: 'stmt-1' });
  });
});
