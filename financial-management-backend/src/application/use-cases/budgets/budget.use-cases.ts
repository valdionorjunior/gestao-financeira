import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { IBudgetRepository, BUDGET_REPOSITORY } from '../../../domain/repositories/budget.repository.interface';
import { CreateBudgetDto, UpdateBudgetDto } from '../../dtos/budgets/budget.dto';
import { parseDateString } from '../../../common/utils/date.utils';

@Injectable()
export class CreateBudgetUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: IBudgetRepository) {}

  async execute(dto: CreateBudgetDto, userId: string) {
    const start = parseDateString(dto.startDate);
    const end   = parseDateString(dto.endDate);

    const existing = await this.repo.findByUserAndPeriod(userId, dto.categoryId, start, end);
    if (existing) {
      throw new ConflictException('Já existe um orçamento para esta categoria neste período');
    }

    return this.repo.save({
      userId,
      name:           dto.name ?? `Orçamento ${dto.period} - ${dto.startDate}`,
      familyId:       dto.familyId,
      categoryId:     dto.categoryId,
      period:         dto.period,
      amount:         dto.amount,
      spentAmount:    0,
      startDate:      start,
      endDate:        end,
      alertThreshold: dto.alertThreshold ?? 80,
      isActive:       true,
    });
  }
}

@Injectable()
export class UpdateBudgetUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: IBudgetRepository) {}

  async execute(id: string, dto: UpdateBudgetDto, userId: string) {
    const budget = await this.repo.findById(id);
    if (!budget) throw new NotFoundException('Orçamento não encontrado');
    if (!budget.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');

    return this.repo.update(id, {
      amount:         dto.amount,
      startDate:      dto.startDate ? parseDateString(dto.startDate) : undefined,
      endDate:        dto.endDate   ? parseDateString(dto.endDate)   : undefined,
      alertThreshold: dto.alertThreshold,
      isActive:       dto.isActive,
    });
  }
}

@Injectable()
export class GetBudgetUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: IBudgetRepository) {}

  async findAll(userId: string, active?: boolean) {
    const budgets = await this.repo.findAllByUser(userId, active);
    return budgets.map(b => ({
      ...b,
      percentUsed:  b.percentUsed(),
      isOverBudget: b.isOverBudget(),
      alertTriggered: b.isAlertThresholdExceeded(),
    }));
  }

  async findOne(id: string, userId: string) {
    const budget = await this.repo.findById(id);
    if (!budget) throw new NotFoundException('Orçamento não encontrado');
    if (!budget.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return {
      ...budget,
      percentUsed:    budget.percentUsed(),
      isOverBudget:   budget.isOverBudget(),
      alertTriggered: budget.isAlertThresholdExceeded(),
    };
  }
}

@Injectable()
export class DeleteBudgetUseCase {
  constructor(@Inject(BUDGET_REPOSITORY) private readonly repo: IBudgetRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const budget = await this.repo.findById(id);
    if (!budget) throw new NotFoundException('Orçamento não encontrado');
    if (!budget.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    await this.repo.delete(id);
  }
}
