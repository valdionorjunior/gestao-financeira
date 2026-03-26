import { Goal } from '../entities/budget-goal.entity';

export const GOAL_REPOSITORY = Symbol('GOAL_REPOSITORY');
export const GOAL_CONTRIBUTION_REPOSITORY = Symbol('GOAL_CONTRIBUTION_REPOSITORY');

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findAllByUser(userId: string): Promise<Goal[]>;
  save(data: Partial<Goal>): Promise<Goal>;
  update(id: string, data: Partial<Goal>): Promise<Goal>;
  updateCurrentAmount(id: string, delta: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IGoalContributionRepository {
  findByGoalId(goalId: string): Promise<GoalContribution[]>;
  save(data: Partial<GoalContribution>): Promise<GoalContribution>;
  delete(id: string): Promise<void>;
}
