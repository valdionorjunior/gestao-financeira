import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  CreateGoalUseCase,
  UpdateGoalUseCase,
  GetGoalUseCase,
  DeleteGoalUseCase,
  AddGoalContributionUseCase,
  GetGoalContributionsUseCase,
} from '../goal.use-cases';
import {
  GOAL_REPOSITORY,
  GOAL_CONTRIBUTION_REPOSITORY,
} from '../../../../domain/repositories/goal.repository.interface';
import { GoalStatus } from '../../../../domain/entities/budget-goal.entity';

const makeGoal = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'goal-uuid-1',
  userId: 'user-1',
  name: 'Viagem Europa',
  targetAmount: 10000,
  currentAmount: 3000,
  status: GoalStatus.ACTIVE,
  targetDate: new Date(Date.now() + 60 * 86400000),
  isOwnedBy: (id: string) => id === 'user-1',
  progressPercent: () => 30,
  remainingAmount: () => 7000,
  isAchieved: () => false,
  ...overrides,
});

const mockGoalRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  findAllByUser: jest.fn(),
  delete: jest.fn(),
  updateCurrentAmount: jest.fn(),
};

const mockContribRepo = {
  save: jest.fn(),
  findByGoalId: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ─── CreateGoalUseCase ────────────────────────────────────────────────────────

describe('CreateGoalUseCase', () => {
  let useCase: CreateGoalUseCase;

  beforeEach(() => {
    useCase = new CreateGoalUseCase(mockGoalRepo as any);
  });

  it('should create a goal with status ACTIVE', async () => {
    mockGoalRepo.save.mockResolvedValue(makeGoal());

    const result = await useCase.execute(
      { name: 'Viagem Europa', targetAmount: 10000, targetDate: '2027-01-01' } as any,
      'user-1',
    );

    expect(mockGoalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        targetAmount: 10000,
        currentAmount: 0,
        status: GoalStatus.ACTIVE,
      }),
    );
    expect(result.id).toBe('goal-uuid-1');
  });

  it('should use default color when not provided', async () => {
    mockGoalRepo.save.mockResolvedValue(makeGoal());

    await useCase.execute({ name: 'Reserva', targetAmount: 5000 } as any, 'user-1');

    expect(mockGoalRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ color: '#17c1e8' }),
    );
  });
});

// ─── UpdateGoalUseCase ────────────────────────────────────────────────────────

describe('UpdateGoalUseCase', () => {
  let useCase: UpdateGoalUseCase;

  beforeEach(() => {
    useCase = new UpdateGoalUseCase(mockGoalRepo as any);
  });

  it('should update a goal successfully', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());
    mockGoalRepo.update.mockResolvedValue({ ...makeGoal(), name: 'Viagem EUA' });

    const result = await useCase.execute('goal-uuid-1', { name: 'Viagem EUA' } as any, 'user-1');

    expect(mockGoalRepo.update).toHaveBeenCalledWith('goal-uuid-1', expect.objectContaining({ name: 'Viagem EUA' }));
    expect(result.name).toBe('Viagem EUA');
  });

  it('should throw NotFoundException when goal does not exist', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { name: 'X' } as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    await expect(
      useCase.execute('goal-uuid-1', { name: 'X' } as any, 'outsider'),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── GetGoalUseCase ───────────────────────────────────────────────────────────

describe('GetGoalUseCase', () => {
  let useCase: GetGoalUseCase;

  beforeEach(() => {
    useCase = new GetGoalUseCase(mockGoalRepo as any);
  });

  it('should return enriched list of goals', async () => {
    mockGoalRepo.findAllByUser.mockResolvedValue([
      makeGoal(),
      makeGoal({ id: 'goal-uuid-2', name: 'Carro', progressPercent: () => 75, remainingAmount: () => 5000, isAchieved: () => false }),
    ]);

    const result = await useCase.findAll('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].progressPercent).toBe(30);
    expect(result[0].remainingAmount).toBe(7000);
    expect(result[0].isAchieved).toBe(false);
  });

  it('should find one goal by id with enriched fields', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    const result = await useCase.findOne('goal-uuid-1', 'user-1');

    expect(result.id).toBe('goal-uuid-1');
    expect(result).toHaveProperty('progressPercent', 30);
    expect(result).toHaveProperty('remainingAmount', 7000);
  });

  it('should throw NotFoundException when goal not found', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);

    await expect(useCase.findOne('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    await expect(useCase.findOne('goal-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── DeleteGoalUseCase ────────────────────────────────────────────────────────

describe('DeleteGoalUseCase', () => {
  let useCase: DeleteGoalUseCase;

  beforeEach(() => {
    useCase = new DeleteGoalUseCase(mockGoalRepo as any);
  });

  it('should delete a goal successfully', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());
    mockGoalRepo.delete.mockResolvedValue(undefined);

    await useCase.execute('goal-uuid-1', 'user-1');
    expect(mockGoalRepo.delete).toHaveBeenCalledWith('goal-uuid-1');
  });

  it('should throw NotFoundException when goal not found', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    await expect(useCase.execute('goal-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── AddGoalContributionUseCase ───────────────────────────────────────────────

describe('AddGoalContributionUseCase', () => {
  let useCase: AddGoalContributionUseCase;

  beforeEach(() => {
    useCase = new AddGoalContributionUseCase(mockGoalRepo as any, mockContribRepo as any);
  });

  it('should add a contribution and update goal current amount', async () => {
    mockGoalRepo.findById
      .mockResolvedValueOnce(makeGoal())         // first call: ownership check
      .mockResolvedValueOnce(makeGoal({ currentAmount: 7000, isAchieved: () => false })); // second call: after update
    mockContribRepo.save.mockResolvedValue({ id: 'contrib-1', amount: 4000 });
    mockGoalRepo.updateCurrentAmount.mockResolvedValue(undefined);
    mockGoalRepo.update.mockResolvedValue(undefined);

    const result = await useCase.execute(
      'goal-uuid-1',
      { amount: 4000, notes: 'Primeiro aporte', date: '2026-03-01' } as any,
      'user-1',
    );

    expect(mockGoalRepo.updateCurrentAmount).toHaveBeenCalledWith('goal-uuid-1', 4000);
    expect(result.id).toBe('contrib-1');
  });

  it('should mark goal as ACHIEVED when contribution completes the target', async () => {
    mockGoalRepo.findById
      .mockResolvedValueOnce(makeGoal())
      .mockResolvedValueOnce(makeGoal({ currentAmount: 10000, status: GoalStatus.ACTIVE, isAchieved: () => true }));
    mockContribRepo.save.mockResolvedValue({ id: 'contrib-2', amount: 7000 });
    mockGoalRepo.updateCurrentAmount.mockResolvedValue(undefined);
    mockGoalRepo.update.mockResolvedValue(undefined);

    await useCase.execute(
      'goal-uuid-1',
      { amount: 7000, notes: 'Conclusão', date: '2026-03-15' } as any,
      'user-1',
    );

    expect(mockGoalRepo.update).toHaveBeenCalledWith('goal-uuid-1', { status: GoalStatus.ACHIEVED });
  });

  it('should throw NotFoundException when goal does not exist', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent', { amount: 100, date: '2026-03-01' } as any, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    await expect(
      useCase.execute('goal-uuid-1', { amount: 100, date: '2026-03-01' } as any, 'outsider'),
    ).rejects.toThrow(ForbiddenException);
  });
});

// ─── GetGoalContributionsUseCase ──────────────────────────────────────────────

describe('GetGoalContributionsUseCase', () => {
  let useCase: GetGoalContributionsUseCase;

  beforeEach(() => {
    useCase = new GetGoalContributionsUseCase(mockGoalRepo as any, mockContribRepo as any);
  });

  it('should return contributions for a goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());
    mockContribRepo.findByGoalId.mockResolvedValue([
      { id: 'contrib-1', amount: 1000 },
      { id: 'contrib-2', amount: 2000 },
    ]);

    const result = await useCase.execute('goal-uuid-1', 'user-1');
    expect(result).toHaveLength(2);
  });

  it('should throw NotFoundException when goal not found', async () => {
    mockGoalRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the goal', async () => {
    mockGoalRepo.findById.mockResolvedValue(makeGoal());

    await expect(useCase.execute('goal-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});
