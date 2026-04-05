export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TITULAR' | 'MEMBRO_FAMILIAR';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  bankName?: string;
  balance: number;
  currency: string;
  color: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color: string;
  isSystem: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export type TransactionType   = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId?: string;
  subcategoryId?: string;
  destinationAccountId?: string;
  tags?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  period: string;
  amount: number;
  spentAmount: number;
  percentUsed: number;
  isOverBudget: boolean;
  alertTriggered: boolean;
  startDate: string;
  endDate: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  status: string;
  targetDate?: string;
  color: string;
}

export interface DashboardSummary {
  month: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netBalance: number;
  accountsCount: number;
  budgetAlerts: Array<{ id: string; categoryId: string; percentUsed: number }>;
  goalsSummary: { total: number; nearDue: any[] };
}

export interface FinancialInsight {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}
