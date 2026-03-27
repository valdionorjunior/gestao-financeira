/**
 * Report Contract Tests
 *
 * Verifica o contrato HTTP da API de relatórios:
 * status codes, shapes de resposta e repasse correto de userId.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ReportController } from '@presentation/controllers/report.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  DashboardSummaryUseCase, MonthlyReportUseCase,
  CashFlowReportUseCase, BudgetReportUseCase,
} from '@application/use-cases/reports/report.use-cases';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDashboard   = { execute: jest.fn() };
const mockMonthly     = { execute: jest.fn() };
const mockCashFlow    = { execute: jest.fn() };
const mockBudget      = { execute: jest.fn() };

const USER_ID = '22222222-2222-4222-a222-222222222222';

const DASHBOARD_STUB = {
  totalIncome:  5000,
  totalExpense: 3200,
  balance:      1800,
  savingsRate:  36,
  topCategories: [],
};

const MONTHLY_STUB = {
  month: 6, year: 2024,
  income: 5000, expense: 3200,
  transactions: [],
};

const CASH_FLOW_STUB = {
  entries: [],
  totalInflow: 5000,
  totalOutflow: 3200,
};

const BUDGET_REPORT_STUB = {
  budgets: [],
  totalBudgeted: 4000,
  totalSpent: 2800,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] Report API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: DashboardSummaryUseCase, useValue: mockDashboard },
        { provide: MonthlyReportUseCase,    useValue: mockMonthly   },
        { provide: CashFlowReportUseCase,   useValue: mockCashFlow  },
        { provide: BudgetReportUseCase,     useValue: mockBudget    },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: USER_ID, email: 'test@example.com', role: 'TITULAR' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  // ─── GET /reports/dashboard ────────────────────────────────────────────────

  describe('GET /api/v1/reports/dashboard', () => {
    it('200 — retorna resumo do dashboard', async () => {
      mockDashboard.execute.mockResolvedValue(DASHBOARD_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .expect(200);

      expect(res.body).toMatchObject({ totalIncome: 5000 });
      expect(mockDashboard.execute).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── GET /reports/monthly ──────────────────────────────────────────────────

  describe('GET /api/v1/reports/monthly', () => {
    it('200 — retorna relatório mensal sem query params', async () => {
      mockMonthly.execute.mockResolvedValue(MONTHLY_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/monthly')
        .expect(200);

      expect(res.body).toMatchObject({ month: 6 });
      expect(mockMonthly.execute).toHaveBeenCalledWith(
        expect.any(Object),
        USER_ID,
      );
    });

    it('200 — aceita query params month e year', async () => {
      mockMonthly.execute.mockResolvedValue(MONTHLY_STUB);

      await request(app.getHttpServer())
        .get('/api/v1/reports/monthly?month=6&year=2024')
        .expect(200);

      expect(mockMonthly.execute).toHaveBeenCalledWith(
        expect.objectContaining({ month: 6, year: 2024 }),
        USER_ID,
      );
    });
  });

  // ─── GET /reports/cash-flow ────────────────────────────────────────────────

  describe('GET /api/v1/reports/cash-flow', () => {
    it('200 — retorna fluxo de caixa sem filtros', async () => {
      mockCashFlow.execute.mockResolvedValue(CASH_FLOW_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/cash-flow')
        .expect(200);

      expect(res.body).toMatchObject({ totalInflow: 5000 });
      expect(mockCashFlow.execute).toHaveBeenCalledWith(
        expect.any(Object),
        USER_ID,
      );
    });

    it('200 — aceita query params startDate e endDate', async () => {
      mockCashFlow.execute.mockResolvedValue(CASH_FLOW_STUB);

      await request(app.getHttpServer())
        .get('/api/v1/reports/cash-flow?startDate=2024-01-01&endDate=2024-06-30')
        .expect(200);

      expect(mockCashFlow.execute).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2024-01-01', endDate: '2024-06-30' }),
        USER_ID,
      );
    });
  });

  // ─── GET /reports/budgets ──────────────────────────────────────────────────

  describe('GET /api/v1/reports/budgets', () => {
    it('200 — retorna relatório de orçamentos', async () => {
      mockBudget.execute.mockResolvedValue(BUDGET_REPORT_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/budgets')
        .expect(200);

      expect(res.body).toMatchObject({ totalBudgeted: 4000 });
      expect(mockBudget.execute).toHaveBeenCalledWith(USER_ID);
    });
  });
});
