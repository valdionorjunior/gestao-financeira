import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  CreateBudgetUseCase,
  UpdateBudgetUseCase,
  GetBudgetUseCase,
  DeleteBudgetUseCase,
} from '../budget.use-cases';
import { BUDGET_REPOSITORY } from '../../../../domain/repositories/budget.repository.interface';
import { BudgetPeriod } from '../../../../domain/entities/budget-goal.entity';

const makeBudget = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'budget-uuid-1',
  userId: 'user-1',
  categoryId: 'cat-1',
  name: 'Alimentação Mensal',
  period: BudgetPeriod.MONTHLY,
  amount: 1000,
  spentAmount: 200,
  alertThreshold: 80,
  isActive: true,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-31'),
  isOwnedBy: (id: string) => id === 'user-1',
  percentUsed: () => 20,
  isOverBudget: () => false,
  isAlertThresholdExceeded: () => false,
  ...overrides,
});

const mockRepo = {
  findByUserAndPeriod: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  findAllByUser: jest.fn(),
  delete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── CreateBudgetUseCase ──────────────────────────────────────────────────────

describe('CreateBudgetUseCase', () => {
  let useCase: CreateBudgetUseCase;

  beforeEach(() => {
    useCase = new CreateBudgetUseCase(mockRepo as any);
  });

  it('should create a budget successfully', async () => {
    mockRepo.findByUserAndPeriod.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(makeBudget());

    const result = await useCase.execute(
      {
        name: 'Alimentação Mensal',
        categoryId: 'cat-1',
        period: BudgetPeriod.MONTHLY,
        amount: 1000,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        alertThreshold: 80,
      } as any,
      'user-1',
    );

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', amount: 1000, spentAmount: 0 }),
    );
    expect(result.id).toBe('budget-uuid-1');
  });

  it('should use default alertThreshold of 80 when not provided', async () => {
    mockRepo.findByUserAndPeriod.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(makeBudget());

    await useCase.execute(
      { categoryId: 'cat-1', period: BudgetPeriod.MONTHLY, amount: 500, startDate: '2026-03-01', endDate: '2026-03-31' } as any,
      'user-1',
    );

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ alertThreshold: 80 }),
    );
  });

  it('should throw ConflictException when budget already exists for category+period', async () => {
    mockRepo.findByUserAndPeriod.mockResolvedValue(makeBudget());

    await expect(
      useCase.execute(
        { categoryId: 'cat-1', period: BudgetPeriod.MONTHLY, amount: 1000, startDate: '2026-03-01', endDate: '2026-03-31' } as any,
        'user-1',
      ),
    ).rejects.toThrow(ConflictException);
  });
});

// ─── UpdateBudgetUseCase ──────────────────────────────────────────────────────

describe('UpdateBudgetUseCase', () => {
  let useCase: UpdateBudgetUseCase;

  beforeEach(() => {
    useCase = new UpdateBudgetUseCase(mockRepo as any);
  });

  it('should update a budget successfully', async () => {
    mockRepo.findById.mockResolvedValue(makeBudget());
    mockRepo.update.mockResolvedValue({ ...makeBudget(), amount: 1500 });

    const result = await useCase.execute('budget-uuid-1', { amount: 1500 } as any, 'user-1');

    expect(mockRepo.update).toHaveBeenCalledWith('budget-uuid-1', expect.objectContaining({ amount: 1500 }));
    expect(result.amount).toBe(1500);
  });

  it('should throw NotFoundException when budget does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { amount: 1500 } as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the budget', async () => {
    mockRepo.findById.mockResolvedValue(makeBudget());

    await expect(
      useCase.execute('budget-uuid-1', { amount: 1500 } as any, 'user-other'),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── GetBudgetUseCase ─────────────────────────────────────────────────────────

describe('GetBudgetUseCase', () => {
  let useCase: GetBudgetUseCase;

  beforeEach(() => {
    useCase = new GetBudgetUseCase(mockRepo as any);
  });

  it('should return enriched list of budgets', async () => {
    mockRepo.findAllByUser.mockResolvedValue([
      makeBudget({ percentUsed: () => 20, isOverBudget: () => false, isAlertThresholdExceeded: () => false }),
      makeBudget({ id: 'budget-uuid-2', amount: 2000, spentAmount: 1800, percentUsed: () => 90, isOverBudget: () => false, isAlertThresholdExceeded: () => true }),
    ]);

    const result = await useCase.findAll('user-1', true);

    expect(result).toHaveLength(2);
    expect(result[0].percentUsed).toBe(20);
    expect(result[1].alertTriggered).toBe(true);
  });

  it('should find one budget by id', async () => {
    const budget = makeBudget({ percentUsed: () => 20, isOverBudget: () => false, isAlertThresholdExceeded: () => false });
    mockRepo.findById.mockResolvedValue(budget);

    const result = await useCase.findOne('budget-uuid-1', 'user-1');

    expect(result.id).toBe('budget-uuid-1');
    expect(result).toHaveProperty('percentUsed', 20);
  });

  it('should throw NotFoundException when budget not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.findOne('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the budget', async () => {
    mockRepo.findById.mockResolvedValue(makeBudget());

    await expect(useCase.findOne('budget-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── DeleteBudgetUseCase ──────────────────────────────────────────────────────

describe('DeleteBudgetUseCase', () => {
  let useCase: DeleteBudgetUseCase;

  beforeEach(() => {
    useCase = new DeleteBudgetUseCase(mockRepo as any);
  });

  it('should delete a budget successfully', async () => {
    mockRepo.findById.mockResolvedValue(makeBudget());
    mockRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('budget-uuid-1', 'user-1');

    expect(mockRepo.delete).toHaveBeenCalledWith('budget-uuid-1');
  });

  it('should throw NotFoundException when budget does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the budget', async () => {
    mockRepo.findById.mockResolvedValue(makeBudget());

    await expect(useCase.execute('budget-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});
