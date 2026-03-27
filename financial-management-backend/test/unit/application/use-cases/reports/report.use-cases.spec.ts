import {
  DashboardSummaryUseCase,
  MonthlyReportUseCase,
  CashFlowReportUseCase,
  BudgetReportUseCase,
} from '@application/use-cases/reports/report.use-cases';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.repository.interface';
import { BUDGET_REPOSITORY } from '@domain/repositories/budget.repository.interface';
import { GOAL_REPOSITORY } from '@domain/repositories/goal.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';
import { GoalStatus } from '@domain/entities/budget-goal.entity';
import { Test, TestingModule } from '@nestjs/testing';

const makeAccount = (balance = 1000) => ({ id: 'acc-1', balance });
const makeBudget = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'budget-1',
  categoryId: 'cat-1',
  period: 'MONTHLY',
  amount: 1000,
  spentAmount: 800,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-31'),
  percentUsed: () => 80,
  isOverBudget: () => false,
  isAlertThresholdExceeded: () => true,
  ...overrides,
});
const makeGoal = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'goal-1',
  name: 'Viagem',
  status: GoalStatus.ACTIVE,
  targetDate: new Date(Date.now() + 20 * 86400000), // 20 days
  progressPercent: () => 70,
  ...overrides,
});

const mockTxRepo = {
  sumByPeriod: jest.fn(),
  findAll: jest.fn(),
};
const mockAccountRepo = { findAllByUserId: jest.fn() };
const mockBudgetRepo   = { findAllByUser: jest.fn() };
const mockGoalRepo     = { findAllByUser: jest.fn() };

beforeEach(() => jest.clearAllMocks());

// ─── DashboardSummaryUseCase ──────────────────────────────────────────────────

describe('DashboardSummaryUseCase', () => {
  let useCase: DashboardSummaryUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardSummaryUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
        { provide: ACCOUNT_REPOSITORY,     useValue: mockAccountRepo },
        { provide: BUDGET_REPOSITORY,      useValue: mockBudgetRepo },
        { provide: GOAL_REPOSITORY,        useValue: mockGoalRepo },
      ],
    }).compile();
    useCase = module.get<DashboardSummaryUseCase>(DashboardSummaryUseCase);
  });

  it('should return full dashboard summary', async () => {
    mockAccountRepo.findAllByUserId.mockResolvedValue([makeAccount(5000), makeAccount(3000)]);
    mockTxRepo.sumByPeriod
      .mockResolvedValueOnce(8000)   // income
      .mockResolvedValueOnce(3000);  // expense
    mockBudgetRepo.findAllByUser.mockResolvedValue([makeBudget()]);
    mockGoalRepo.findAllByUser.mockResolvedValue([makeGoal()]);

    const result = await useCase.execute('user-1');

    expect(result.totalBalance).toBe(8000);
    expect(result.monthlyIncome).toBe(8000);
    expect(result.monthlyExpense).toBe(3000);
    expect(result.netBalance).toBe(5000);
    expect(result.accountsCount).toBe(2);
    expect(result.budgetAlerts).toHaveLength(1);
    expect(result.goalsSummary.nearDue).toHaveLength(1);
  });

  it('should return empty budget alerts when all budgets are within threshold', async () => {
    mockAccountRepo.findAllByUserId.mockResolvedValue([makeAccount(1000)]);
    mockTxRepo.sumByPeriod.mockResolvedValue(0);
    mockBudgetRepo.findAllByUser.mockResolvedValue([makeBudget({ isAlertThresholdExceeded: () => false })]);
    mockGoalRepo.findAllByUser.mockResolvedValue([]);

    const result = await useCase.execute('user-1');
    expect(result.budgetAlerts).toHaveLength(0);
  });
});

// ─── MonthlyReportUseCase ─────────────────────────────────────────────────────

describe('MonthlyReportUseCase', () => {
  let useCase: MonthlyReportUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyReportUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
      ],
    }).compile();
    useCase = module.get<MonthlyReportUseCase>(MonthlyReportUseCase);
  });

  it('should return monthly summary with expense breakdown by category', async () => {
    mockTxRepo.sumByPeriod
      .mockResolvedValueOnce(4000)  // income
      .mockResolvedValueOnce(1500); // expense
    mockTxRepo.findAll.mockResolvedValue({
      data: [
        { type: TransactionType.EXPENSE, categoryId: 'cat-1', amount: 800 },
        { type: TransactionType.EXPENSE, categoryId: 'cat-2', amount: 400 },
        { type: TransactionType.EXPENSE, categoryId: 'cat-1', amount: 300 },
        { type: TransactionType.INCOME,  categoryId: 'cat-3', amount: 4000 },
      ],
      total: 4,
    });

    const result = await useCase.execute({ year: 2026, month: 3 }, 'user-1');

    expect(result.income).toBe(4000);
    expect(result.expense).toBe(1500);
    expect(result.netBalance).toBe(2500);
    expect(result.savingsRate).toBeCloseTo(62.5);
    const catEntry = result.expenseByCategory.find((e: any) => e.categoryId === 'cat-1');
    expect(catEntry?.total).toBe(1100.0);
  });

  it('should return savingsRate of 0 when income is 0', async () => {
    mockTxRepo.sumByPeriod.mockResolvedValue(0);
    mockTxRepo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await useCase.execute({ year: 2026, month: 3 }, 'user-1');
    expect(result.savingsRate).toBe(0);
  });

  it('should sort expenseByCategory from highest to lowest', async () => {
    mockTxRepo.sumByPeriod.mockResolvedValueOnce(5000).mockResolvedValueOnce(3000);
    mockTxRepo.findAll.mockResolvedValue({
      data: [
        { type: TransactionType.EXPENSE, categoryId: 'cat-b', amount: 200 },
        { type: TransactionType.EXPENSE, categoryId: 'cat-a', amount: 1500 },
        { type: TransactionType.EXPENSE, categoryId: 'cat-c', amount: 900 },
      ],
      total: 3,
    });

    const result = await useCase.execute({ year: 2026, month: 3 }, 'user-1');
    expect(result.expenseByCategory[0].categoryId).toBe('cat-a');
    expect(result.expenseByCategory[1].categoryId).toBe('cat-c');
    expect(result.expenseByCategory[2].categoryId).toBe('cat-b');
  });
});

// ─── CashFlowReportUseCase ────────────────────────────────────────────────────

describe('CashFlowReportUseCase', () => {
  let useCase: CashFlowReportUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowReportUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
      ],
    }).compile();
    useCase = module.get<CashFlowReportUseCase>(CashFlowReportUseCase);
  });

  it('should return cash flow for a date range spanning multiple months', async () => {
    // Use mid-month dates (day 15) to avoid UTC→local timezone boundary issues
    // 3 months × 2 calls = 6 total
    mockTxRepo.sumByPeriod
      .mockResolvedValueOnce(3000).mockResolvedValueOnce(2000) // Jan
      .mockResolvedValueOnce(3500).mockResolvedValueOnce(2200) // Feb
      .mockResolvedValueOnce(4000).mockResolvedValueOnce(1800); // Mar

    const result = await useCase.execute(
      { startDate: '2026-01-15', endDate: '2026-03-20' },
      'user-1',
    );

    expect(result.cashFlow).toHaveLength(3);
    const nets = result.cashFlow.map((m: any) => m.net);
    expect(nets).toContain(1000);  // Jan net
    expect(nets).toContain(2200);  // Mar net
  });

  it('should return a single-month cash flow when start and end are the same month', async () => {
    mockTxRepo.sumByPeriod
      .mockResolvedValueOnce(5000)
      .mockResolvedValueOnce(3000);

    const result = await useCase.execute(
      { startDate: '2026-03-10', endDate: '2026-03-20' },
      'user-1',
    );

    expect(result.cashFlow).toHaveLength(1);
    expect(result.cashFlow[0].income).toBe(5000);
    expect(result.cashFlow[0].expense).toBe(3000);
    expect(result.cashFlow[0].net).toBe(2000);
  });
});

// ─── BudgetReportUseCase ──────────────────────────────────────────────────────

describe('BudgetReportUseCase', () => {
  let useCase: BudgetReportUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetReportUseCase,
        { provide: BUDGET_REPOSITORY,      useValue: mockBudgetRepo },
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
      ],
    }).compile();
    useCase = module.get<BudgetReportUseCase>(BudgetReportUseCase);
  });

  it('should return budget report with computed fields', async () => {
    mockBudgetRepo.findAllByUser.mockResolvedValue([
      makeBudget({ amount: 1000, spentAmount: 800, percentUsed: () => 80, isOverBudget: () => false, isAlertThresholdExceeded: () => true }),
    ]);

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].remainingAmount).toBe(200);
    expect(result[0].percentUsed).toBe(80);
    expect(result[0].alertTriggered).toBe(true);
    expect(result[0].isOverBudget).toBe(false);
  });

  it('should clamp remainingAmount to 0 when budget is exceeded', async () => {
    mockBudgetRepo.findAllByUser.mockResolvedValue([
      makeBudget({ amount: 1000, spentAmount: 1200, percentUsed: () => 120, isOverBudget: () => true, isAlertThresholdExceeded: () => true }),
    ]);

    const result = await useCase.execute('user-1');
    expect(result[0].remainingAmount).toBe(0);
    expect(result[0].isOverBudget).toBe(true);
  });
});
