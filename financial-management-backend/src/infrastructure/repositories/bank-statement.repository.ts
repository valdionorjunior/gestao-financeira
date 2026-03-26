import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankStatementEntity }     from '../persistence/typeorm/entities/bank-statement.entity';
import { BankStatementItemEntity } from '../persistence/typeorm/entities/bank-statement-item.entity';
import {
  IBankStatementRepository, IBankStatementItemRepository,
} from '../../domain/repositories/bank-statement.repository.interface';
import { BankStatement, BankStatementItem, ReconciliationStatus } from '../../domain/entities/bank-statement.entity';

@Injectable()
export class BankStatementRepository implements IBankStatementRepository {
  constructor(
    @InjectRepository(BankStatementEntity)
    private readonly repo: Repository<BankStatementEntity>,
  ) {}

  private toModel(e: BankStatementEntity): BankStatement {
    return {
      id:           e.id,
      userId:       e.userId,
      accountId:    e.accountId,
      filename:     (e as any).fileName ?? (e as any).filename,
      fileType:     e.fileType as any,
      importedAt:   (e as any).importedAt ?? (e as any).createdAt,
      itemCount:    (e as any).itemCount ?? 0,
      matchedCount: (e as any).matchedCount ?? 0,
      periodStart:  (e as any).periodStart,
      periodEnd:    (e as any).periodEnd,
      createdAt:    (e as any).createdAt,
    };
  }

  async save(data: Partial<BankStatement>): Promise<BankStatement> {
    const entity = this.repo.create({
      userId:    data.userId,
      accountId: data.accountId,
      fileName:  data.filename,
      fileType:  data.fileType as any,
      fileUrl:   '',
      ...(data as any),
    } as Partial<BankStatementEntity>);
    const saved = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async findById(id: string): Promise<BankStatement | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toModel(row) : null;
  }

  async findAllByUser(userId: string): Promise<BankStatement[]> {
    const rows = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } as any });
    return rows.map(r => this.toModel(r));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

@Injectable()
export class BankStatementItemRepository implements IBankStatementItemRepository {
  constructor(
    @InjectRepository(BankStatementItemEntity)
    private readonly repo: Repository<BankStatementItemEntity>,
  ) {}

  private toModel(e: BankStatementItemEntity): BankStatementItem {
    return {
      id:                  e.id,
      statementId:         e.statementId,
      externalId:          undefined,
      type:                e.type as any,
      amount:              Number(e.amount),
      description:         e.description,
      date:                new Date(e.date),
      status:              e.status as unknown as ReconciliationStatus,
      transactionId:       e.transactionId,
      suggestedCategoryId: undefined,
    };
  }

  async saveMany(items: Partial<BankStatementItem>[]): Promise<BankStatementItem[]> {
    const entities = this.repo.create(items as Partial<BankStatementItemEntity>[]);
    const saved    = await this.repo.save(entities);
    return saved.map(e => this.toModel(e));
  }

  async findByStatementId(statementId: string): Promise<BankStatementItem[]> {
    const rows = await this.repo.find({ where: { statementId }, order: { date: 'DESC' } as any });
    return rows.map(r => this.toModel(r));
  }

  async updateStatus(id: string, status: ReconciliationStatus, transactionId?: string): Promise<void> {
    await this.repo.update(id, { status: status as any, ...(transactionId ? { transactionId } : {}) });
  }

  async findUnmatched(statementId: string): Promise<BankStatementItem[]> {
    const rows = await this.repo.find({ where: { statementId, status: 'PENDING' as any } });
    return rows.map(r => this.toModel(r));
  }
}
