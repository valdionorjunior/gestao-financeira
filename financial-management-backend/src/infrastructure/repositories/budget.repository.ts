import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from '../persistence/typeorm/entities/budget.entity';
import { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { Budget } from '../../domain/entities/budget-goal.entity';

@Injectable()
export class BudgetRepository implements IBudgetRepository {
  constructor(
    @InjectRepository(BudgetEntity)
    private readonly repo: Repository<BudgetEntity>,
  ) {}

  private toModel(e: BudgetEntity): Budget {
    const b = new Budget();
    Object.assign(b, e);
    return b;
  }

  async findById(id: string): Promise<Budget | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toModel(row) : null;
  }

  async findAllByUser(userId: string, active?: boolean): Promise<Budget[]> {
    const where: any = { userId };
    if (active !== undefined) where.isActive = active;
    const rows = await this.repo.find({ where, order: { startDate: 'DESC' } });
    return rows.map(r => this.toModel(r));
  }

  async findByUserAndPeriod(userId: string, categoryId: string, start: Date, end: Date): Promise<Budget | null> {
    const row = await this.repo
      .createQueryBuilder('b')
      .where('b.user_id = :userId AND b.category_id = :categoryId AND b.is_active = true', { userId, categoryId })
      .andWhere('b.start_date <= :end AND b.end_date >= :start', { start, end })
      .getOne();
    return row ? this.toModel(row) : null;
  }

  async save(data: Partial<Budget>): Promise<Budget> {
    const entity = this.repo.create(data as Partial<BudgetEntity>);
    const saved  = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Budget>): Promise<Budget> {
    await this.repo.update(id, data as Partial<BudgetEntity>);
    return (await this.findById(id)) as Budget;
  }

  async updateSpent(id: string, spentAmount: number): Promise<void> {
    await this.repo.update(id, { spentAmount } as any);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
