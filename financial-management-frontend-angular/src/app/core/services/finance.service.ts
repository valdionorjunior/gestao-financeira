import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  Account, Category, Subcategory,
  Transaction, PaginatedResult,
  Budget, Goal,
  DashboardSummary, FinancialInsight,
} from '../models';

export interface TransactionFilter {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BudgetFilter { period?: string; }
export interface GoalFilter   { status?: string; }

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  /* ── Accounts ─────────────────────────────────────────── */
  getAccounts()                            { return this.http.get<Account[]>(`${this.api}/accounts`); }
  getAccount(id: string)                   { return this.http.get<Account>(`${this.api}/accounts/${id}`); }
  createAccount(body: Partial<Account>)    { return this.http.post<Account>(`${this.api}/accounts`, body); }
  updateAccount(id: string, b: Partial<Account>) { return this.http.patch<Account>(`${this.api}/accounts/${id}`, b); }
  deleteAccount(id: string)                { return this.http.delete<void>(`${this.api}/accounts/${id}`); }

  /* ── Categories ───────────────────────────────────────── */
  getCategories()                            { return this.http.get<Category[]>(`${this.api}/categories`); }
  getCategory(id: string)                    { return this.http.get<Category>(`${this.api}/categories/${id}`); }
  createCategory(b: Partial<Category>)       { return this.http.post<Category>(`${this.api}/categories`, b); }
  updateCategory(id: string, b: Partial<Category>) { return this.http.put<Category>(`${this.api}/categories/${id}`, b); }
  deleteCategory(id: string)                 { return this.http.delete<void>(`${this.api}/categories/${id}`); }

  getSubcategories(categoryId: string)         { return this.http.get<Subcategory[]>(`${this.api}/categories/${categoryId}/subcategories`); }
  createSubcategory(categoryId: string, b: Partial<Subcategory>) {
    return this.http.post<Subcategory>(`${this.api}/categories/${categoryId}/subcategories`, b);
  }
  deleteSubcategory(categoryId: string, id: string) {
    return this.http.delete<void>(`${this.api}/categories/${categoryId}/subcategories/${id}`);
  }

  /* ── Transactions ─────────────────────────────────────── */
  getTransactions(f: TransactionFilter = {}) {
    let params = new HttpParams();
    if (f.page)       params = params.set('page',       f.page);
    if (f.limit)      params = params.set('limit',      f.limit);
    if (f.type)       params = params.set('type',       f.type);
    if (f.status)     params = params.set('status',     f.status);
    if (f.accountId)  params = params.set('accountId',  f.accountId);
    if (f.categoryId) params = params.set('categoryId', f.categoryId);
    if (f.startDate)  params = params.set('startDate',  f.startDate);
    if (f.endDate)    params = params.set('endDate',    f.endDate);
    return this.http.get<PaginatedResult<Transaction>>(`${this.api}/transactions`, { params });
  }
  getTransaction(id: string)                    { return this.http.get<Transaction>(`${this.api}/transactions/${id}`); }
  createTransaction(b: Partial<Transaction>)    { return this.http.post<Transaction>(`${this.api}/transactions`, b); }
  updateTransaction(id: string, b: Partial<Transaction>) { return this.http.put<Transaction>(`${this.api}/transactions/${id}`, b); }
  deleteTransaction(id: string)                 { return this.http.delete<void>(`${this.api}/transactions/${id}`); }

  /* ── Budgets ──────────────────────────────────────────── */
  getBudgets(f: BudgetFilter = {}) {
    let params = new HttpParams();
    if (f.period) params = params.set('period', f.period);
    return this.http.get<Budget[]>(`${this.api}/budgets`, { params });
  }
  createBudget(b: Partial<Budget>)              { return this.http.post<Budget>(`${this.api}/budgets`, b); }
  updateBudget(id: string, b: Partial<Budget>)  { return this.http.put<Budget>(`${this.api}/budgets/${id}`, b); }
  deleteBudget(id: string)                      { return this.http.delete<void>(`${this.api}/budgets/${id}`); }

  /* ── Goals ────────────────────────────────────────────── */
  getGoals(f: GoalFilter = {}) {
    let params = new HttpParams();
    if (f.status) params = params.set('status', f.status);
    return this.http.get<Goal[]>(`${this.api}/goals`, { params });
  }
  createGoal(b: Partial<Goal>)                  { return this.http.post<Goal>(`${this.api}/goals`, b); }
  updateGoal(id: string, b: Partial<Goal>)       { return this.http.put<Goal>(`${this.api}/goals/${id}`, b); }
  deleteGoal(id: string)                        { return this.http.delete<void>(`${this.api}/goals/${id}`); }
  addContribution(goalId: string, amount: number) {
    return this.http.post(`${this.api}/goals/${goalId}/contributions`, { amount });
  }

  /* ── Dashboard ────────────────────────────────────────── */
  getDashboard()  { return this.http.get<DashboardSummary>(`${this.api}/reports/dashboard`); }
  getInsights()   { return this.http.get<FinancialInsight[]>(`${this.api}/ai/insights`); }

  /* ── Reports ──────────────────────────────────────────── */
  /**
   * GET /reports/cash-flow
   * Params: startDate, endDate, accountId, categoryId (todos opcionais)
   * Resposta: { cashFlow: [{ year, month, income, expense, net }] }
   */
  getCashFlow(options: { startDate?: string; endDate?: string; accountId?: string; categoryId?: string } = {}) {
    let params = new HttpParams();
    if (options.startDate)  params = params.set('startDate',  options.startDate);
    if (options.endDate)    params = params.set('endDate',    options.endDate);
    if (options.accountId)  params = params.set('accountId',  options.accountId);
    if (options.categoryId) params = params.set('categoryId', options.categoryId);
    return this.http.get<{ cashFlow: any[] }>(`${this.api}/reports/cash-flow`, { params });
  }

  /**
   * GET /reports/monthly
   * Params: year, month, accountId (todos opcionais)
   * Resposta: { period, income, expense, netBalance, savingsRate, expenseByCategory, transactionCount }
   */
  getMonthlySummary(year: number, month: number, accountId?: string) {
    let params = new HttpParams().set('year', year).set('month', month);
    if (accountId) params = params.set('accountId', accountId);
    return this.http.get<any>(`${this.api}/reports/monthly`, { params });
  }

  getBudgetReport() {
    return this.http.get<any[]>(`${this.api}/reports/budgets`);
  }

  /* ── Bank Statements ─────────────────────────────────── */
  /**
   * POST /bank-statements/import/:accountId
   * accountId no PATH, apenas o arquivo no body (multipart/form-data)
   */
  uploadStatement(accountId: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${this.api}/bank-statements/import/${accountId}`, fd);
  }

  /** GET /bank-statements — filtrado automaticamente pelo usuário autenticado */
  getStatements() {
    return this.http.get<any[]>(`${this.api}/bank-statements`);
  }

  /** GET /bank-statements/:id/items */
  getStatementItems(id: string) {
    return this.http.get<any[]>(`${this.api}/bank-statements/${id}/items`);
  }

  /** POST /bank-statements/:id/items/:itemId/reconcile */
  reconcileItem(statementId: string, itemId: string, dto: { action: 'match' | 'create' | 'ignore'; transactionId?: string; categoryId?: string }) {
    return this.http.post<any>(`${this.api}/bank-statements/${statementId}/items/${itemId}/reconcile`, dto);
  }

  /* ── AI ──────────────────────────────────────────────── */
  askAi(message: string, context?: any) {
    return this.http.post<{ response: string }>(`${this.api}/ai/chat`, { message, context });
  }
  getPredict() {
    return this.http.get<{ history: Array<{ month: string; expense: number }>; predictedNextMonth: number }>(`${this.api}/ai/predict`);
  }
}
