import {
  Injectable, Inject, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import {
  IGoalRepository, GOAL_REPOSITORY,
  IGoalContributionRepository, GOAL_CONTRIBUTION_REPOSITORY,
} from '../../../domain/repositories/goal.repository.interface';
import { GoalStatus } from '../../../domain/entities/budget-goal.entity';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from '../../dtos/goals/goal.dto';
import { parseDateString } from '../../../common/utils/date.utils';

@Injectable()
export class CreateGoalUseCase {
  constructor(@Inject(GOAL_REPOSITORY) private readonly repo: IGoalRepository) {}

  async execute(dto: CreateGoalDto, userId: string) {
    return this.repo.save({
      userId,
      familyId:     dto.familyId,
      accountId:    dto.accountId,
      name:         dto.name,
      description:  dto.description,
      targetAmount: dto.targetAmount,
      currentAmount: 0,
      targetDate:   dto.targetDate ? parseDateString(dto.targetDate) : undefined,
      color:        dto.color ?? '#17c1e8',
      icon:         dto.icon,
      status:       GoalStatus.ACTIVE,
    });
  }
}

@Injectable()
export class UpdateGoalUseCase {
  constructor(@Inject(GOAL_REPOSITORY) private readonly repo: IGoalRepository) {}

  async execute(id: string, dto: UpdateGoalDto, userId: string) {
    const goal = await this.repo.findById(id);
    if (!goal) throw new NotFoundException('Meta não encontrada');
    if (!goal.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return this.repo.update(id, {
      name:         dto.name,
      description:  dto.description,
      targetAmount: dto.targetAmount,
      targetDate:   dto.targetDate ? parseDateString(dto.targetDate) : undefined,
      status:       dto.status,
      color:        dto.color,
    });
  }
}

@Injectable()
export class GetGoalUseCase {
  constructor(@Inject(GOAL_REPOSITORY) private readonly repo: IGoalRepository) {}

  async findAll(userId: string) {
    const goals = await this.repo.findAllByUser(userId);
    return goals.map(g => ({
      ...g,
      progressPercent: g.progressPercent(),
      remainingAmount: g.remainingAmount(),
      isAchieved:      g.isAchieved(),
    }));
  }

  async findOne(id: string, userId: string) {
    const goal = await this.repo.findById(id);
    if (!goal) throw new NotFoundException('Meta não encontrada');
    if (!goal.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return {
      ...goal,
      progressPercent: goal.progressPercent(),
      remainingAmount: goal.remainingAmount(),
      isAchieved:      goal.isAchieved(),
    };
  }
}

@Injectable()
export class DeleteGoalUseCase {
  constructor(@Inject(GOAL_REPOSITORY) private readonly repo: IGoalRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const goal = await this.repo.findById(id);
    if (!goal) throw new NotFoundException('Meta não encontrada');
    if (!goal.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    await this.repo.delete(id);
  }
}

@Injectable()
export class AddGoalContributionUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_CONTRIBUTION_REPOSITORY) private readonly contribRepo: IGoalContributionRepository,
  ) {}

  async execute(goalId: string, dto: AddContributionDto, userId: string) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundException('Meta não encontrada');
    if (!goal.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');

    const contribution = await this.contribRepo.save({
      goalId,
      userId,
      amount: dto.amount,
      notes:  dto.notes,
      date:   parseDateString(dto.date),
    });

    await this.goalRepo.updateCurrentAmount(goalId, dto.amount);

    const updated = await this.goalRepo.findById(goalId);
    if (updated && updated.isAchieved() && updated.status === GoalStatus.ACTIVE) {
      await this.goalRepo.update(goalId, { status: GoalStatus.ACHIEVED });
    }

    return contribution;
  }
}

@Injectable()
export class GetGoalContributionsUseCase {
  constructor(
    @Inject(GOAL_REPOSITORY) private readonly goalRepo: IGoalRepository,
    @Inject(GOAL_CONTRIBUTION_REPOSITORY) private readonly contribRepo: IGoalContributionRepository,
  ) {}

  async execute(goalId: string, userId: string) {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) throw new NotFoundException('Meta não encontrada');
    if (!goal.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return this.contribRepo.findByGoalId(goalId);
  }
}
