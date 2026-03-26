import { BankStatement, BankStatementItem, ReconciliationStatus } from '../entities/bank-statement.entity';

export const BANK_STATEMENT_REPOSITORY      = Symbol('BANK_STATEMENT_REPOSITORY');
export const BANK_STATEMENT_ITEM_REPOSITORY = Symbol('BANK_STATEMENT_ITEM_REPOSITORY');

export interface IBankStatementRepository {
  save(data: Partial<BankStatement>): Promise<BankStatement>;
  findById(id: string): Promise<BankStatement | null>;
  findAllByUser(userId: string): Promise<BankStatement[]>;
  delete(id: string): Promise<void>;
}

export interface IBankStatementItemRepository {
  saveMany(items: Partial<BankStatementItem>[]): Promise<BankStatementItem[]>;
  findByStatementId(statementId: string): Promise<BankStatementItem[]>;
  updateStatus(id: string, status: ReconciliationStatus, transactionId?: string): Promise<void>;
  findUnmatched(statementId: string): Promise<BankStatementItem[]>;
}
