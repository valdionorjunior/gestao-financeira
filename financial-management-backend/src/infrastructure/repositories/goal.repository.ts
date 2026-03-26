import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalEntity } from '../persistence/typeorm/entities/goal.entity';
import { GoalContributionEntity } from '../persistence/typeorm/entities/goal-contribution.entity';
import {
  IGoalRepository, IGoalContributionRepository, GoalContribution,
} from '../../domain/repositories/goal.repository.interface';
import { Goal } from '../../domain/entities/budget-goal.entity';

@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(
    @InjectRepository(GoalEntity)
    private readonly repo: Repository<GoalEntity>,
  ) {}

  private toModel(e: GoalEntity): Goal {
    const g = new Goal();
    Object.assign(g, e);
    return g;
  }

  async findById(id: string): Promise<Goal | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toModel(row) : null;
  }

  async findAllByUser(userId: string): Promise<Goal[]> {
    const rows = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map(r => this.toModel(r));
  }

  async save(data: Partial<Goal>): Promise<Goal> {
    const entity = this.repo.create(data as Partial<GoalEntity>);
    const saved  = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Goal>): Promise<Goal> {
    await this.repo.update(id, data as Partial<GoalEntity>);
    return (await this.findById(id)) as Goal;
  }

  async updateCurrentAmount(id: string, delta: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(GoalEntity)
      .set({ currentAmount: () => `current_amount + ${delta}` } as any)
      .where('id = :id', { id })
      .execute();
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

@Injectable()
export class GoalContributionRepository implements IGoalContributionRepository {
  constructor(
    @InjectRepository(GoalContributionEntity)
    private readonly repo: Repository<GoalContributionEntity>,
  ) {}

  async findByGoalId(goalId: string): Promise<GoalContribution[]> {
    const rows = await this.repo.find({ where: { goalId }, order: { date: 'DESC' } as any });
    return rows.map(r => ({
      id:        r.id,
      goalId:    r.goalId,
      userId:    (r as any).userId ?? '',
      amount:    Number(r.amount),
      notes:     (r as any).notes,
      date:      (r as any).date,
      createdAt: (r as any).createdAt,
    }));
  }

  async save(data: Partial<GoalContribution>): Promise<GoalContribution> {
    const entity = this.repo.create(data as Partial<GoalContributionEntity>);
    const saved  = await this.repo.save(entity);
    return {
      id:        saved.id,
      goalId:    saved.goalId,
      userId:    (saved as any).userId ?? '',
      amount:    Number(saved.amount),
      notes:     (saved as any).notes,
      date:      (saved as any).date,
      createdAt: (saved as any).createdAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
