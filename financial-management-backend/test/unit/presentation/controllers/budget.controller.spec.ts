import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from '@presentation/controllers/budget.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateBudgetUseCase, UpdateBudgetUseCase,
  GetBudgetUseCase, DeleteBudgetUseCase,
} from '@application/use-cases/budgets/budget.use-cases';

const mockCreateUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockGetUseCase    = { findAll: jest.fn(), findOne: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };
const BUDGET_ID = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';

const BUDGET = {
  id: BUDGET_ID,
  userId: USER.userId,
  name: 'Alimentação',
  amount: 1000,
  spent: 400,
  period: 'MONTHLY',
  isActive: true,
};

describe('BudgetController', () => {
  let controller: BudgetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        { provide: CreateBudgetUseCase, useValue: mockCreateUseCase },
        { provide: UpdateBudgetUseCase, useValue: mockUpdateUseCase },
        { provide: GetBudgetUseCase,    useValue: mockGetUseCase },
        { provide: DeleteBudgetUseCase, useValue: mockDeleteUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(BudgetController);
    jest.clearAllMocks();
  });

  describe('POST /budgets → create()', () => {
    it('delega para CreateBudgetUseCase com userId', async () => {
      mockCreateUseCase.execute.mockResolvedValue(BUDGET);

      const result = await controller.create(
        { name: 'Alimentação', amount: 1000, period: 'MONTHLY' } as any,
        USER,
      );

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alimentação' }),
        USER.userId,
      );
      expect(result).toEqual(BUDGET);
    });
  });

  describe('GET /budgets → findAll()', () => {
    it('retorna lista e passa active=true corretamente', async () => {
      mockGetUseCase.findAll.mockResolvedValue([BUDGET]);

      const result = await controller.findAll(USER, 'true');

      expect(mockGetUseCase.findAll).toHaveBeenCalledWith(USER.userId, true);
      expect(result).toHaveLength(1);
    });

    it('passa active=false quando query é "false"', async () => {
      mockGetUseCase.findAll.mockResolvedValue([]);

      await controller.findAll(USER, 'false');

      expect(mockGetUseCase.findAll).toHaveBeenCalledWith(USER.userId, false);
    });

    it('passa active=undefined quando query não é fornecida', async () => {
      mockGetUseCase.findAll.mockResolvedValue([BUDGET]);

      await controller.findAll(USER, undefined);

      expect(mockGetUseCase.findAll).toHaveBeenCalledWith(USER.userId, undefined);
    });
  });

  describe('GET /budgets/:id → findOne()', () => {
    it('busca orçamento por ID', async () => {
      mockGetUseCase.findOne.mockResolvedValue(BUDGET);

      const result = await controller.findOne(BUDGET_ID, USER);

      expect(mockGetUseCase.findOne).toHaveBeenCalledWith(BUDGET_ID, USER.userId);
      expect(result).toEqual(BUDGET);
    });
  });

  describe('PUT /budgets/:id → update()', () => {
    it('delega update com id, dto e userId', async () => {
      const updated = { ...BUDGET, amount: 1500 };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const result = await controller.update(BUDGET_ID, { amount: 1500 } as any, USER);

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(BUDGET_ID, { amount: 1500 }, USER.userId);
      expect(result.amount).toBe(1500);
    });
  });

  describe('DELETE /budgets/:id → remove()', () => {
    it('delega delete com id e userId', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await controller.remove(BUDGET_ID, USER);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(BUDGET_ID, USER.userId);
    });
  });
});
