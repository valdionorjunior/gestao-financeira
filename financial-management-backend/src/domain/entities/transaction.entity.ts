export enum TransactionType {
  INCOME   = 'INCOME',
  EXPENSE  = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED  = 'CANCELED',
}

export class Transaction {
  id!: string;
  userId!: string;
  accountId!: string;
  destinationAccountId?: string;
  categoryId?: string;
  subcategoryId?: string;
  type!: TransactionType;
  status!: TransactionStatus;
  amount!: number;
  description!: string;
  notes?: string;
  date!: Date;
  dueDate?: Date;
  isRecurring!: boolean;
  recurrenceRule?: string;
  transferPairId?: string;
  attachmentUrl?: string;
  tags?: string[];
  createdAt!: Date;
  updatedAt!: Date;

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  isTransfer(): boolean {
    return this.type === TransactionType.TRANSFER;
  }

  isIncome(): boolean {
    return this.type === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this.type === TransactionType.EXPENSE;
  }
}
