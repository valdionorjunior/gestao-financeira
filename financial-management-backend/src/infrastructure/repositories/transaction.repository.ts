import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TransactionEntity } from '../persistence/typeorm/entities/transaction.entity';
import {
  ITransactionRepository, TransactionFilter, PaginatedResult,
} from '../../domain/repositories/transaction.repository.interface';
import { Transaction, TransactionType } from '../../domain/entities/transaction.entity';
import { convertDatesToStrings, convertStringsToDate } from '../../common/utils/date-mapper.util';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  private toModel(e: TransactionEntity): Transaction {
    const t = new Transaction();
    Object.assign(t, e);
    // Convert date strings back to Date objects for proper JSON serialization
    const converted = convertStringsToDate(t, ['date', 'dueDate'] as any);
    Object.assign(t, converted);
    return t;
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.repo.findOne({ where: { id, deletedAt: IsNull() as any } });
    return row ? this.toModel(row) : null;
  }

  async findByTransferPairId(transferPairId: string): Promise<Transaction[]> {
    const rows = await this.repo.find({
      where: { transferPairId, deletedAt: IsNull() as any },
    });
    return rows.map(r => this.toModel(r));
  }

  async findAll(filter: TransactionFilter): Promise<PaginatedResult<Transaction>> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.deleted_at IS NULL');

    if (filter.userId)      qb.andWhere('t.user_id = :userId',       { userId: filter.userId });
    if (filter.accountId)   qb.andWhere('t.account_id = :accountId', { accountId: filter.accountId });
    if (filter.categoryId)  qb.andWhere('t.category_id = :catId',    { catId: filter.categoryId });
    if (filter.type)        qb.andWhere('t.type = :type',            { type: filter.type });
    if (filter.status)      qb.andWhere('t.status = :status',        { status: filter.status });
    if (filter.startDate)   qb.andWhere('t.date >= :start',          { start: filter.startDate });
    if (filter.endDate)     qb.andWhere('t.date <= :end',            { end: filter.endDate });
    if (filter.description) qb.andWhere('t.description ILIKE :desc', { desc: `%${filter.description}%` });

    const page  = filter.page  ?? 1;
    const limit = filter.limit ?? 20;
    qb.orderBy('t.date', 'DESC').addOrderBy('t.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(r => this.toModel(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(data: Partial<Transaction>): Promise<Transaction> {
    const converted = convertDatesToStrings(data, ['date', 'dueDate'] as any);
    const entity = this.repo.create(converted as Partial<TransactionEntity>);
    const saved  = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const converted = convertDatesToStrings(data, ['date', 'dueDate'] as any);
    await this.repo.update(id, converted as Partial<TransactionEntity>);
    return (await this.findById(id)) as Transaction;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async sumByPeriod(userId: string, type: TransactionType, start: Date, end: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId AND t.type = :type AND t.date >= :start AND t.date <= :end AND t.deleted_at IS NULL AND t.status = \'CONFIRMED\'', 
        { userId, type, start, end })
      .getRawOne();
    return parseFloat(result?.total ?? '0');
  }
}
