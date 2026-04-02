export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TITULAR' | 'MEMBRO_FAMILIAR';
  avatar?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  currency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon?: string;
  familyId: string;
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
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  categoryId: string;
  period: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE';
  familyId: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  accountsCount: number;
  transactionsCount: number;
}
