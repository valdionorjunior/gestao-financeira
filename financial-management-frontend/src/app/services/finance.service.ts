import api from './api';
import type {
  Account, Category, Transaction, PaginatedResult, Budget, Goal, DashboardSummary, FinancialInsight,
} from '../types';

// ── Accounts ──────────────────────────────────────────────────
export const accountsService = {
  list:   ()              => api.get<Account[]>('/accounts').then(r => r.data),
  getOne: (id: string)    => api.get<Account>(`/accounts/${id}`).then(r => r.data),
  create: (body: Partial<Account>) => api.post<Account>('/accounts', body).then(r => r.data),
  update: (id: string, body: Partial<Account>) => api.patch<Account>(`/accounts/${id}`, body).then(r => r.data),
  remove: (id: string)    => api.delete(`/accounts/${id}`),
};

// ── Categories ────────────────────────────────────────────────
export const categoriesService = {
  list:   (type?: string) => api.get<Category[]>('/categories', { params: { type } }).then(r => r.data),
  system: ()              => api.get<Category[]>('/categories/system').then(r => r.data),
  create: (body: any)     => api.post<Category>('/categories', body).then(r => r.data),
  update: (id: string, body: any) => api.put<Category>(`/categories/${id}`, body).then(r => r.data),
  remove: (id: string)    => api.delete(`/categories/${id}`),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionsService = {
  list: (params?: Record<string, any>) =>
    api.get<PaginatedResult<Transaction>>('/transactions', { params }).then(r => r.data),
  getOne: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`).then(r => r.data),
  create: (body: any) =>
    api.post<Transaction>('/transactions', body).then(r => r.data),
  createTransfer: (body: any) =>
    api.post('/transactions/transfer', body).then(r => r.data),
  update: (id: string, body: any) =>
    api.put<Transaction>(`/transactions/${id}`, body).then(r => r.data),
  remove: (id: string) =>
    api.delete(`/transactions/${id}`),
};

// ── Budgets ───────────────────────────────────────────────────
export const budgetsService = {
  list:   (active?: boolean) => api.get<Budget[]>('/budgets', { params: { active } }).then(r => r.data),
  create: (body: any)        => api.post<Budget>('/budgets', body).then(r => r.data),
  update: (id: string, body: any) => api.put<Budget>(`/budgets/${id}`, body).then(r => r.data),
  remove: (id: string)       => api.delete(`/budgets/${id}`),
};

// ── Goals ─────────────────────────────────────────────────────
export const goalsService = {
  list:   ()             => api.get<Goal[]>('/goals').then(r => r.data),
  create: (body: any)    => api.post<Goal>('/goals', body).then(r => r.data),
  update: (id: string, body: any) => api.put<Goal>(`/goals/${id}`, body).then(r => r.data),
  remove: (id: string)   => api.delete(`/goals/${id}`),
  addContribution: (id: string, body: any) =>
    api.post(`/goals/${id}/contributions`, body).then(r => r.data),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsService = {
  dashboard: ()          => api.get<DashboardSummary>('/reports/dashboard').then(r => r.data),
  monthly:   (params?: any) => api.get('/reports/monthly', { params }).then(r => r.data),
  cashFlow:  (params?: any) => api.get('/reports/cash-flow', { params }).then(r => r.data),
  budgetReport: ()       => api.get('/reports/budgets').then(r => r.data),
};

// ── AI ────────────────────────────────────────────────────────
export const aiService = {
  categorize: (description: string, amount: number) =>
    api.post('/ai/categorize', { description, amount }).then(r => r.data),
  insights: ()  => api.get<FinancialInsight[]>('/ai/insights').then(r => r.data),
  predict:  ()  => api.get('/ai/predict').then(r => r.data),
  chat:     (message: string) =>
    api.post<{ response: string }>('/ai/chat', { message }).then(r => r.data),
};
