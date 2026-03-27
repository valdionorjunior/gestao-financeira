import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from '@presentation/controllers/report.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  DashboardSummaryUseCase, MonthlyReportUseCase,
  CashFlowReportUseCase, BudgetReportUseCase,
} from '@application/use-cases/reports/report.use-cases';

const mockDashboardUseCase = { execute: jest.fn() };
const mockMonthlyUseCase   = { execute: jest.fn() };
const mockCashFlowUseCase  = { execute: jest.fn() };
const mockBudgetUseCase    = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };

describe('ReportController', () => {
  let controller: ReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: DashboardSummaryUseCase, useValue: mockDashboardUseCase },
        { provide: MonthlyReportUseCase,    useValue: mockMonthlyUseCase },
        { provide: CashFlowReportUseCase,   useValue: mockCashFlowUseCase },
        { provide: BudgetReportUseCase,     useValue: mockBudgetUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ReportController);
    jest.clearAllMocks();
  });

  describe('GET /reports/dashboard → dashboard()', () => {
    it('retorna resumo do dashboard do mês atual', async () => {
      const summary = { income: 3000, expense: 2000, balance: 1000 };
      mockDashboardUseCase.execute.mockResolvedValue(summary);

      const result = await controller.dashboard(USER);

      expect(mockDashboardUseCase.execute).toHaveBeenCalledWith(USER.userId);
      expect(result).toEqual(summary);
    });
  });

  describe('GET /reports/monthly → monthly()', () => {
    it('retorna relatório mensal com filtros', async () => {
      const monthly = { income: 5000, expense: 3500, balance: 1500 };
      mockMonthlyUseCase.execute.mockResolvedValue(monthly);

      const result = await controller.monthly({ year: 2024, month: 1 } as any, USER);

      expect(mockMonthlyUseCase.execute).toHaveBeenCalledWith({ year: 2024, month: 1 }, USER.userId);
      expect(result).toEqual(monthly);
    });
  });

  describe('GET /reports/cash-flow → cashFlow()', () => {
    it('retorna fluxo de caixa por período', async () => {
      const flow = [{ date: '2024-01-01', income: 0, expense: 150 }];
      mockCashFlowUseCase.execute.mockResolvedValue(flow);

      const result = await controller.cashFlow({ startDate: '2024-01-01', endDate: '2024-01-31' } as any, USER);

      expect(mockCashFlowUseCase.execute).toHaveBeenCalledWith(
        { startDate: '2024-01-01', endDate: '2024-01-31' },
        USER.userId,
      );
      expect(result).toEqual(flow);
    });
  });

  describe('GET /reports/budgets → budgetReport()', () => {
    it('retorna relatório de orçamentos vs gastos', async () => {
      const report = [{ budget: 1000, spent: 700, remaining: 300 }];
      mockBudgetUseCase.execute.mockResolvedValue(report);

      const result = await controller.budgetReport(USER);

      expect(mockBudgetUseCase.execute).toHaveBeenCalledWith(USER.userId);
      expect(result).toEqual(report);
    });
  });
});
