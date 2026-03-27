import { Account, AccountType } from '@domain/entities/account.entity';

function makeAccount(overrides: Partial<Account> = {}): Account {
  const a = new Account();
  a.id = 'acc-uuid-1';
  a.userId = 'user-uuid-1';
  a.name = 'Conta Corrente';
  a.type = AccountType.CHECKING;
  a.balance = 1000;
  a.currency = 'BRL';
  a.isActive = true;
  a.includeInTotal = true;
  a.createdAt = new Date();
  a.updatedAt = new Date();
  return Object.assign(a, overrides);
}

describe('Account entity', () => {
  describe('isOwnedBy()', () => {
    it('should return true when userId matches', () => {
      const account = makeAccount();
      expect(account.isOwnedBy('user-uuid-1')).toBe(true);
    });

    it('should return false when userId does not match', () => {
      const account = makeAccount();
      expect(account.isOwnedBy('other-user')).toBe(false);
    });
  });

  describe('isCreditCard()', () => {
    it('should return true for CREDIT_CARD type', () => {
      const account = makeAccount({ type: AccountType.CREDIT_CARD });
      expect(account.isCreditCard()).toBe(true);
    });

    it('should return false for CHECKING type', () => {
      const account = makeAccount({ type: AccountType.CHECKING });
      expect(account.isCreditCard()).toBe(false);
    });

    it('should return false for SAVINGS type', () => {
      const account = makeAccount({ type: AccountType.SAVINGS });
      expect(account.isCreditCard()).toBe(false);
    });
  });

  describe('availableCredit()', () => {
    it('should return available credit for credit card (limit - |balance|)', () => {
      const account = makeAccount({
        type: AccountType.CREDIT_CARD,
        balance: -300,
        creditLimit: 2000,
      });
      expect(account.availableCredit()).toBe(1700);
    });

    it('should return 0 for non-credit-card account', () => {
      const account = makeAccount({ type: AccountType.CHECKING, creditLimit: 5000 });
      expect(account.availableCredit()).toBe(0);
    });

    it('should return 0 when creditLimit is not set', () => {
      const account = makeAccount({ type: AccountType.CREDIT_CARD, creditLimit: undefined });
      expect(account.availableCredit()).toBe(0);
    });

    it('should return full limit when balance is zero', () => {
      const account = makeAccount({
        type: AccountType.CREDIT_CARD,
        balance: 0,
        creditLimit: 5000,
      });
      expect(account.availableCredit()).toBe(5000);
    });
  });

  describe('AccountType enum', () => {
    it('should have all expected values', () => {
      expect(AccountType.CHECKING).toBe('CHECKING');
      expect(AccountType.SAVINGS).toBe('SAVINGS');
      expect(AccountType.CREDIT_CARD).toBe('CREDIT_CARD');
      expect(AccountType.INVESTMENT).toBe('INVESTMENT');
      expect(AccountType.CASH).toBe('CASH');
      expect(AccountType.OTHER).toBe('OTHER');
    });
  });
});
