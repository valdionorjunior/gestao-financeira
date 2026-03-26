export enum ReconciliationStatus {
  PENDING   = 'PENDING',
  MATCHED   = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  IGNORED   = 'IGNORED',
}

export class BankStatement {
  id!: string;
  userId!: string;
  accountId!: string;
  filename!: string;
  fileType!: 'OFX' | 'CSV';
  importedAt!: Date;
  itemCount!: number;
  matchedCount!: number;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt!: Date;
}

export class BankStatementItem {
  id!: string;
  statementId!: string;
  externalId?: string;
  type!: 'DEBIT' | 'CREDIT';
  amount!: number;
  description!: string;
  date!: Date;
  status!: ReconciliationStatus;
  transactionId?: string;
  suggestedCategoryId?: string;
}
