import { Budget, BudgetPeriod } from '../entities/budget-goal.entity';

export const BUDGET_REPOSITORY = Symbol('BUDGET_REPOSITORY');

export interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findAllByUser(userId: string, active?: boolean): Promise<Budget[]>;
  findByUserAndPeriod(userId: string, categoryId: string, start: Date, end: Date): Promise<Budget | null>;
  save(data: Partial<Budget>): Promise<Budget>;
  update(id: string, data: Partial<Budget>): Promise<Budget>;
  updateSpent(id: string, spentAmount: number): Promise<void>;
  delete(id: string): Promise<void>;
}
