import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock the axios api module ────────────────────────────────────────────────
vi.mock('../app/services/api', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../app/services/api';
import {
  accountsService,
  categoriesService,
  transactionsService,
  budgetsService,
  goalsService,
  reportsService,
  aiService,
} from '../app/services/finance.service';
import { authService } from '../app/services/auth.service';

const mockedApi = api as ReturnType<typeof vi.fn> & typeof api;

beforeEach(() => vi.clearAllMocks());

// ─── authService ──────────────────────────────────────────────────────────────

describe('authService', () => {
  it('login() should POST to /auth/login and return data', async () => {
    const loginResp = { accessToken: 'tok', refreshToken: 'ref', user: { id: '1', email: 'a@b.com' } };
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: loginResp });

    const result = await authService.login('a@b.com', 'pass');
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
    expect(result.accessToken).toBe('tok');
  });

  it('register() should POST to /auth/register', async () => {
    const regResp = { accessToken: 'tok', refreshToken: 'ref', user: { id: '2', email: 'b@c.com' } };
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: regResp });

    const result = await authService.register({ email: 'b@c.com', password: 'Pass@123', firstName: 'João', lastName: 'Silva', lgpdConsent: true });
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'b@c.com', lgpdConsent: true }));
    expect(result.user.email).toBe('b@c.com');
  });

  it('logout() should POST to /auth/logout with refreshToken', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });
    await authService.logout('my-refresh-token');
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'my-refresh-token' });
  });

  it('me() should GET /auth/me and return user', async () => {
    const user = { id: '1', email: 'a@b.com', firstName: 'João' };
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: user });
    const result = await authService.me();
    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
    expect(result.email).toBe('a@b.com');
  });
});

// ─── accountsService ──────────────────────────────────────────────────────────

describe('accountsService', () => {
  it('list() should GET /accounts', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await accountsService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/accounts');
  });

  it('create() should POST /accounts with body', async () => {
    const account = { id: 'acc-1', name: 'Nubank' };
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: account });
    const result = await accountsService.create({ name: 'Nubank' } as any);
    expect(mockedApi.post).toHaveBeenCalledWith('/accounts', { name: 'Nubank' });
    expect(result.id).toBe('acc-1');
  });

  it('update() should PATCH /accounts/:id', async () => {
    (mockedApi.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'acc-1', name: 'Itaú' } });
    const result = await accountsService.update('acc-1', { name: 'Itaú' } as any);
    expect(mockedApi.patch).toHaveBeenCalledWith('/accounts/acc-1', { name: 'Itaú' });
    expect(result.name).toBe('Itaú');
  });

  it('remove() should DELETE /accounts/:id', async () => {
    (mockedApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });
    await accountsService.remove('acc-1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/accounts/acc-1');
  });
});

// ─── categoriesService ────────────────────────────────────────────────────────

describe('categoriesService', () => {
  it('list() should GET /categories without type filter', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await categoriesService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/categories', { params: { type: undefined } });
  });

  it('list(type) should pass type as query param', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await categoriesService.list('EXPENSE');
    expect(mockedApi.get).toHaveBeenCalledWith('/categories', { params: { type: 'EXPENSE' } });
  });

  it('create() should POST /categories', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'cat-1', name: 'Alimentação' } });
    const result = await categoriesService.create({ name: 'Alimentação', type: 'EXPENSE' });
    expect(result.name).toBe('Alimentação');
  });

  it('update() should PUT /categories/:id', async () => {
    (mockedApi.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'cat-1', name: 'Comida' } });
    await categoriesService.update('cat-1', { name: 'Comida' });
    expect(mockedApi.put).toHaveBeenCalledWith('/categories/cat-1', { name: 'Comida' });
  });
});

// ─── transactionsService ──────────────────────────────────────────────────────

describe('transactionsService', () => {
  it('list() should GET /transactions with optional params', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: [], total: 0 } });
    await transactionsService.list({ page: 1, limit: 20 });
    expect(mockedApi.get).toHaveBeenCalledWith('/transactions', { params: { page: 1, limit: 20 } });
  });

  it('create() should POST /transactions', async () => {
    const txn = { id: 'txn-1', amount: 150 };
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: txn });
    const result = await transactionsService.create({ amount: 150, type: 'EXPENSE' });
    expect(mockedApi.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({ amount: 150 }));
    expect(result.id).toBe('txn-1');
  });

  it('createTransfer() should POST /transactions/transfer', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    await transactionsService.createTransfer({ accountId: 'a1', destinationAccountId: 'a2', amount: 500 });
    expect(mockedApi.post).toHaveBeenCalledWith('/transactions/transfer', expect.objectContaining({ amount: 500 }));
  });

  it('update() should PUT /transactions/:id', async () => {
    (mockedApi.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'txn-1', description: 'Supermercado' } });
    await transactionsService.update('txn-1', { description: 'Supermercado' });
    expect(mockedApi.put).toHaveBeenCalledWith('/transactions/txn-1', { description: 'Supermercado' });
  });
});

// ─── budgetsService ───────────────────────────────────────────────────────────

describe('budgetsService', () => {
  it('list() should GET /budgets', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await budgetsService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/budgets', { params: { active: undefined } });
  });

  it('list(active=true) should pass active filter', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await budgetsService.list(true);
    expect(mockedApi.get).toHaveBeenCalledWith('/budgets', { params: { active: true } });
  });

  it('create() should POST /budgets', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'bud-1' } });
    const result = await budgetsService.create({ amount: 1000 });
    expect(result.id).toBe('bud-1');
  });

  it('remove() should DELETE /budgets/:id', async () => {
    (mockedApi.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: undefined });
    await budgetsService.remove('bud-1');
    expect(mockedApi.delete).toHaveBeenCalledWith('/budgets/bud-1');
  });
});

// ─── goalsService ─────────────────────────────────────────────────────────────

describe('goalsService', () => {
  it('list() should GET /goals', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await goalsService.list();
    expect(mockedApi.get).toHaveBeenCalledWith('/goals');
  });

  it('addContribution() should POST /goals/:id/contributions', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'contrib-1' } });
    const result = await goalsService.addContribution('goal-1', { amount: 500, date: '2026-03-01' });
    expect(mockedApi.post).toHaveBeenCalledWith('/goals/goal-1/contributions', expect.objectContaining({ amount: 500 }));
    expect(result.id).toBe('contrib-1');
  });
});

// ─── reportsService ───────────────────────────────────────────────────────────

describe('reportsService', () => {
  it('dashboard() should GET /reports/dashboard', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    await reportsService.dashboard();
    expect(mockedApi.get).toHaveBeenCalledWith('/reports/dashboard');
  });

  it('cashFlow() should GET /reports/cash-flow with params', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { cashFlow: [] } });
    await reportsService.cashFlow({ startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(mockedApi.get).toHaveBeenCalledWith('/reports/cash-flow', expect.objectContaining({ params: { startDate: '2026-01-01', endDate: '2026-12-31' } }));
  });

  it('monthly() should GET /reports/monthly with params', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    await reportsService.monthly({ year: 2026, month: 3 });
    expect(mockedApi.get).toHaveBeenCalledWith('/reports/monthly', { params: { year: 2026, month: 3 } });
  });
});

// ─── aiService ────────────────────────────────────────────────────────────────

describe('aiService', () => {
  it('categorize() should POST /ai/categorize', async () => {
    (mockedApi.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { categoryName: 'Alimentação', confidence: 0.9 } });
    const result = await aiService.categorize('ifood pedido', 45);
    expect(mockedApi.post).toHaveBeenCalledWith('/ai/categorize', { description: 'ifood pedido', amount: 45 });
    expect(result.categoryName).toBe('Alimentação');
  });

  it('insights() should GET /ai/insights', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    await aiService.insights();
    expect(mockedApi.get).toHaveBeenCalledWith('/ai/insights');
  });

  it('predict() should GET /ai/predict', async () => {
    (mockedApi.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { history: [], predictedNextMonth: 2000 } });
    const result = await aiService.predict();
    expect(mockedApi.get).toHaveBeenCalledWith('/ai/predict');
    expect(result.predictedNextMonth).toBe(2000);
  });
});
