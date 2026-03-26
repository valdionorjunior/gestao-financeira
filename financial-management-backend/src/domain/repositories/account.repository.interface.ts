import { Account } from '../entities/account.entity';

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findAllByUserId(userId: string, includeInactive?: boolean): Promise<Account[]>;
  findAllByFamilyId(familyId: string): Promise<Account[]>;
  save(data: Partial<Account>): Promise<Account>;
  update(id: string, data: Partial<Account>): Promise<Account>;
  updateBalance(id: string, amount: number): Promise<void>;
  softDelete(id: string): Promise<void>;
  existsByNameAndUser(name: string, userId: string, excludeId?: string): Promise<boolean>;
}

export const ACCOUNT_REPOSITORY = Symbol('IAccountRepository');
