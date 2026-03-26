export enum AccountType {
  CHECKING    = 'CHECKING',
  SAVINGS     = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT  = 'INVESTMENT',
  CASH        = 'CASH',
  OTHER       = 'OTHER',
}

export class Account {
  id: string;
  userId: string;
  familyId?: string;
  name: string;
  type: AccountType;
  bankName?: string;
  bankCode?: string;
  agency?: string;        // descriptografado no domínio
  accountNumber?: string; // descriptografado no domínio
  balance: number;
  creditLimit?: number;
  currency: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  includeInTotal: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  isCreditCard(): boolean {
    return this.type === AccountType.CREDIT_CARD;
  }

  availableCredit(): number {
    if (!this.isCreditCard() || !this.creditLimit) return 0;
    return this.creditLimit - Math.abs(this.balance);
  }
}
