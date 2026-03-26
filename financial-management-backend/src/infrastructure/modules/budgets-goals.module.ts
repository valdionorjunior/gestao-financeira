import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetEntity }           from '../persistence/typeorm/entities/budget.entity';
import { GoalEntity }             from '../persistence/typeorm/entities/goal.entity';
import { GoalContributionEntity } from '../persistence/typeorm/entities/goal-contribution.entity';
import { BudgetRepository }       from '../repositories/budget.repository';
import { GoalRepository, GoalContributionRepository } from '../repositories/goal.repository';
import { BUDGET_REPOSITORY }      from '../../domain/repositories/budget.repository.interface';
import {
  GOAL_REPOSITORY, GOAL_CONTRIBUTION_REPOSITORY,
} from '../../domain/repositories/goal.repository.interface';
import {
  CreateBudgetUseCase, UpdateBudgetUseCase,
  GetBudgetUseCase, DeleteBudgetUseCase,
} from '../../application/use-cases/budgets/budget.use-cases';
import {
  CreateGoalUseCase, UpdateGoalUseCase, GetGoalUseCase, DeleteGoalUseCase,
  AddGoalContributionUseCase, GetGoalContributionsUseCase,
} from '../../application/use-cases/goals/goal.use-cases';
import { BudgetController } from '../../presentation/controllers/budget.controller';
import { GoalController }   from '../../presentation/controllers/goal.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BudgetEntity, GoalEntity, GoalContributionEntity]),
  ],
  providers: [
    { provide: BUDGET_REPOSITORY,            useClass: BudgetRepository },
    { provide: GOAL_REPOSITORY,              useClass: GoalRepository },
    { provide: GOAL_CONTRIBUTION_REPOSITORY, useClass: GoalContributionRepository },
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    GetBudgetUseCase,
    DeleteBudgetUseCase,
    CreateGoalUseCase,
    UpdateGoalUseCase,
    GetGoalUseCase,
    DeleteGoalUseCase,
    AddGoalContributionUseCase,
    GetGoalContributionsUseCase,
  ],
  controllers: [BudgetController, GoalController],
  exports: [BUDGET_REPOSITORY, GOAL_REPOSITORY],
})
export class BudgetsGoalsModule {}
