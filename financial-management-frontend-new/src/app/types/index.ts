export interface User {
  id: string;
  email: string;
  name?: string;          // legado — pode não vir do backend
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TITULAR' | 'MEMBRO_FAMILIAR';
  avatarUrl?: string;
  avatar?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT' | 'CASH' | 'OTHER';
  balance: number;
  currency: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon?: string;
  familyId?: string;
  userId?: string;
  createdAt: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId?: string;
  subcategoryId?: string;
  accountId: string;
  destinationAccountId?: string;
  date: string;
  // Backend usa PENDING | CONFIRMED | CANCELED
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  // Backend usa: amount / spentAmount / isActive / period (MONTHLY|WEEKLY|YEARLY)
  amount: number;
  spentAmount: number;
  categoryId: string;
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  isActive: boolean;
  alertThreshold: number;
  percentUsed: number;
  isOverBudget: boolean;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  // Backend usa targetDate (não dueDate)
  targetDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  remainingAmount: number;
  isAchieved: boolean;
  userId: string;
  createdAt: string;
}

export interface FinancialSummary {
  // Backend retorna: totalBalance, monthlyIncome, monthlyExpense, netBalance, accountsCount
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netBalance: number;
  accountsCount: number;
  month: string;
  budgetAlerts: { id: string; categoryId: string; percentUsed: number }[];
  goalsSummary: { total: number; nearDue: any[] };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyReport {
  period: { year: number; month: number; startDate: string; endDate: string };
  income: number;
  expense: number;
  netBalance: number;
  savingsRate: number;
  expenseByCategory: { categoryId: string; total: number }[];
  transactionCount: number;
}

export interface CashFlowReport {
  items: { date: string; income: number; expense: number; balance: number }[];
}

