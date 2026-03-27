import { Test, TestingModule } from '@nestjs/testing';
import { GoalController } from '@presentation/controllers/goal.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateGoalUseCase, UpdateGoalUseCase,
  GetGoalUseCase, DeleteGoalUseCase,
  AddGoalContributionUseCase, GetGoalContributionsUseCase,
} from '@application/use-cases/goals/goal.use-cases';

const mockCreateUseCase      = { execute: jest.fn() };
const mockUpdateUseCase      = { execute: jest.fn() };
const mockGetUseCase         = { findAll: jest.fn(), findOne: jest.fn() };
const mockDeleteUseCase      = { execute: jest.fn() };
const mockAddContribUseCase  = { execute: jest.fn() };
const mockGetContribsUseCase = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };
const GOAL_ID = 'g1b2c3d4-e5f6-7890-abcd-ef1234567890';

const GOAL = {
  id: GOAL_ID,
  userId: USER.userId,
  name: 'Viagem',
  targetAmount: 5000,
  currentAmount: 1000,
  deadline: '2025-12-31',
  status: 'IN_PROGRESS',
};

describe('GoalController', () => {
  let controller: GoalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [
        { provide: CreateGoalUseCase,          useValue: mockCreateUseCase },
        { provide: UpdateGoalUseCase,          useValue: mockUpdateUseCase },
        { provide: GetGoalUseCase,             useValue: mockGetUseCase },
        { provide: DeleteGoalUseCase,          useValue: mockDeleteUseCase },
        { provide: AddGoalContributionUseCase, useValue: mockAddContribUseCase },
        { provide: GetGoalContributionsUseCase, useValue: mockGetContribsUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GoalController);
    jest.clearAllMocks();
  });

  describe('POST /goals → create()', () => {
    it('cria meta e retorna resultado', async () => {
      mockCreateUseCase.execute.mockResolvedValue(GOAL);

      const result = await controller.create({ name: 'Viagem', targetAmount: 5000 } as any, USER);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Viagem' }),
        USER.userId,
      );
      expect(result).toEqual(GOAL);
    });
  });

  describe('GET /goals → findAll()', () => {
    it('lista metas do usuário', async () => {
      mockGetUseCase.findAll.mockResolvedValue([GOAL]);

      const result = await controller.findAll(USER);

      expect(mockGetUseCase.findAll).toHaveBeenCalledWith(USER.userId);
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /goals/:id → findOne()', () => {
    it('busca meta por ID', async () => {
      mockGetUseCase.findOne.mockResolvedValue(GOAL);

      const result = await controller.findOne(GOAL_ID, USER);

      expect(mockGetUseCase.findOne).toHaveBeenCalledWith(GOAL_ID, USER.userId);
      expect(result).toEqual(GOAL);
    });
  });

  describe('PUT /goals/:id → update()', () => {
    it('atualiza meta', async () => {
      const updated = { ...GOAL, targetAmount: 6000 };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const result = await controller.update(GOAL_ID, { targetAmount: 6000 } as any, USER);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(GOAL_ID, expect.any(Object), USER.userId);
      expect(result.targetAmount).toBe(6000);
    });
  });

  describe('DELETE /goals/:id → remove()', () => {
    it('exclui meta', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await controller.remove(GOAL_ID, USER);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(GOAL_ID, USER.userId);
    });
  });

  describe('POST /goals/:id/contributions → addContribution()', () => {
    it('adiciona aporte à meta', async () => {
      const contrib = { id: 'contrib-1', goalId: GOAL_ID, amount: 500, date: new Date() };
      mockAddContribUseCase.execute.mockResolvedValue(contrib);

      const result = await controller.addContribution(GOAL_ID, { amount: 500 } as any, USER);

      expect(mockAddContribUseCase.execute).toHaveBeenCalledWith(GOAL_ID, { amount: 500 }, USER.userId);
      expect(result).toEqual(contrib);
    });
  });

  describe('GET /goals/:id/contributions → getContributions()', () => {
    it('lista aportes da meta', async () => {
      const contribs = [{ id: 'contrib-1', amount: 500 }];
      mockGetContribsUseCase.execute.mockResolvedValue(contribs);

      const result = await controller.getContributions(GOAL_ID, USER);

      expect(mockGetContribsUseCase.execute).toHaveBeenCalledWith(GOAL_ID, USER.userId);
      expect(result).toEqual(contribs);
    });
  });
});
