import { Transaction, TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const t = new Transaction();
  t.id = 'txn-uuid-1';
  t.userId = 'user-uuid-1';
  t.accountId = 'acc-uuid-1';
  t.type = TransactionType.EXPENSE;
  t.status = TransactionStatus.CONFIRMED;
  t.amount = 100;
  t.description = 'Supermercado';
  t.date = new Date();
  t.isRecurring = false;
  t.createdAt = new Date();
  t.updatedAt = new Date();
  return Object.assign(t, overrides);
}

describe('Transaction entity', () => {
  describe('isOwnedBy()', () => {
    it('should return true when userId matches', () => {
      const txn = makeTransaction();
      expect(txn.isOwnedBy('user-uuid-1')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const txn = makeTransaction();
      expect(txn.isOwnedBy('other-user')).toBe(false);
    });
  });

  describe('isTransfer()', () => {
    it('should return true for TRANSFER type', () => {
      const txn = makeTransaction({ type: TransactionType.TRANSFER });
      expect(txn.isTransfer()).toBe(true);
    });

    it('should return false for EXPENSE type', () => {
      const txn = makeTransaction({ type: TransactionType.EXPENSE });
      expect(txn.isTransfer()).toBe(false);
    });
  });

  describe('isIncome()', () => {
    it('should return true for INCOME type', () => {
      const txn = makeTransaction({ type: TransactionType.INCOME });
      expect(txn.isIncome()).toBe(true);
    });

    it('should return false for EXPENSE type', () => {
      const txn = makeTransaction({ type: TransactionType.EXPENSE });
      expect(txn.isIncome()).toBe(false);
    });
  });

  describe('isExpense()', () => {
    it('should return true for EXPENSE type', () => {
      const txn = makeTransaction({ type: TransactionType.EXPENSE });
      expect(txn.isExpense()).toBe(true);
    });

    it('should return false for INCOME type', () => {
      const txn = makeTransaction({ type: TransactionType.INCOME });
      expect(txn.isExpense()).toBe(false);
    });
  });

  describe('TransactionType enum', () => {
    it('should have INCOME, EXPENSE and TRANSFER values', () => {
      expect(TransactionType.INCOME).toBe('INCOME');
      expect(TransactionType.EXPENSE).toBe('EXPENSE');
      expect(TransactionType.TRANSFER).toBe('TRANSFER');
    });
  });

  describe('TransactionStatus enum', () => {
    it('should have PENDING, CONFIRMED and CANCELED values', () => {
      expect(TransactionStatus.PENDING).toBe('PENDING');
      expect(TransactionStatus.CONFIRMED).toBe('CONFIRMED');
      expect(TransactionStatus.CANCELED).toBe('CANCELED');
    });
  });
});
