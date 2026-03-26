import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AccountEntity } from '../persistence/typeorm/entities/account.entity';
import { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { Account } from '../../domain/entities/account.entity';

@Injectable()
export class AccountRepository implements IAccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  private toModel(e: AccountEntity): Account {
    const a = new Account();
    Object.assign(a, e);
    return a;
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.repo
      .createQueryBuilder('a')
      .addSelect('a.agency')
      .addSelect('a.accountNumber')
      .where('a.id = :id AND a.deleted_at IS NULL', { id })
      .getOne();
    return row ? this.toModel(row) : null;
  }

  async findAllByUserId(userId: string, includeInactive = false): Promise<Account[]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.user_id = :userId AND a.deleted_at IS NULL', { userId });
    if (!includeInactive) qb.andWhere('a.is_active = true');
    qb.orderBy('a.name', 'ASC');
    const rows = await qb.getMany();
    return rows.map(r => this.toModel(r));
  }

  async findAllByFamilyId(familyId: string): Promise<Account[]> {
    const rows = await this.repo.find({
      where: { familyId, isActive: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
    return rows.map(r => this.toModel(r));
  }

  async save(data: Partial<Account>): Promise<Account> {
    const entity = this.repo.create(data as Partial<AccountEntity>);
    const saved = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Account>): Promise<Account> {
    await this.repo.update(id, data as Partial<AccountEntity>);
    return this.findById(id) as Promise<Account>;
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(AccountEntity)
      .set({ balance: () => `balance + ${amount}` })
      .where('id = :id', { id })
      .execute();
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async existsByNameAndUser(name: string, userId: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('LOWER(a.name) = LOWER(:name) AND a.user_id = :userId AND a.deleted_at IS NULL', { name, userId });
    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });
    const count = await qb.getCount();
    return count > 0;
  }
}
