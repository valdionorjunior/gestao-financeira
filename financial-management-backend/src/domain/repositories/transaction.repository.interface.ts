import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionFilter {
  userId?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findAll(filter: TransactionFilter): Promise<PaginatedResult<Transaction>>;
  findByTransferPairId(transferPairId: string): Promise<Transaction[]>;
  save(data: Partial<Transaction>): Promise<Transaction>;
  update(id: string, data: Partial<Transaction>): Promise<Transaction>;
  softDelete(id: string): Promise<void>;
  sumByPeriod(userId: string, type: TransactionType, start: Date, end: Date): Promise<number>;
}
