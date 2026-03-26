import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  AICategoryService,
  AIInsightsService,
  AIExpensePredictionService,
  AIChatService,
} from '../../../../infrastructure/services/ai.service';
import {
  AICategorizationUseCase,
  AIInsightsUseCase,
  AIPredictionUseCase,
  AIChatUseCase,
} from '../ai.use-cases';
import { TRANSACTION_REPOSITORY } from '../../../../domain/repositories/transaction.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../../domain/repositories/category.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../../../domain/repositories/account.repository.interface';
import { GOAL_REPOSITORY } from '../../../../domain/repositories/goal.repository.interface';
import { TransactionType } from '../../../../domain/entities/transaction.entity';

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockTxRepo = {
  sumByPeriod: jest.fn(),
  findAll: jest.fn(),
};

const mockCategoryRepo = {
  findAll: jest.fn(),
};

const mockAccountRepo = {
  findAllByUserId: jest.fn(),
};

const mockGoalRepo = {
  findAllByUser: jest.fn(),
};

const mockCategoryService   = { categorize: jest.fn() };
const mockInsightsService   = { generateInsights: jest.fn() };
const mockPredictionService = { predictNextMonth: jest.fn() };
const mockChatService       = { chat: jest.fn() };

const noKeyConfig = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;

beforeEach(() => jest.clearAllMocks());

// ─── AICategoryService (unit) ─────────────────────────────────────────────────

describe('AICategoryService (keyword fallback)', () => {
  let service: AICategoryService;

  beforeEach(() => {
    service = new AICategoryService(noKeyConfig);
  });

  it.each([
    ['supermercado Extra', 'Alimentação'],
    ['ifood pedido', 'Restaurantes'],
    ['uber corrida', 'Transporte'],
    ['Netflix mensal', 'Entretenimento'],
    ['conta de luz', 'Contas & Serviços'],
    ['farmacia drogasil', 'Saúde'],
    ['salário maio', 'Salário'],
  ])('should classify "%s" as "%s"', async (description, expectedCategory) => {
    const result = await service.categorize(description, 100, [
      { id: 'c1', name: 'Alimentação', type: 'EXPENSE' },
      { id: 'c2', name: 'Restaurantes', type: 'EXPENSE' },
      { id: 'c3', name: 'Transporte', type: 'EXPENSE' },
      { id: 'c4', name: 'Entretenimento', type: 'EXPENSE' },
      { id: 'c5', name: 'Contas & Serviços', type: 'EXPENSE' },
      { id: 'c6', name: 'Saúde', type: 'EXPENSE' },
      { id: 'c7', name: 'Salário', type: 'INCOME' },
    ]);
    expect(result.categoryName).toBe(expectedCategory);
    expect(result.confidence).toBeGreaterThanOrEqual(0.3);
  });

  it('should return Outros with low confidence for unknown descriptions', async () => {
    const result = await service.categorize('transferência bancária desconhecida', 50, []);
    expect(result.categoryName).toBe('Outros');
    expect(result.confidence).toBe(0.3);
  });
});

// ─── AIExpensePredictionService (unit) ───────────────────────────────────────

describe('AIExpensePredictionService', () => {
  let service: AIExpensePredictionService;

  beforeEach(() => {
    service = new AIExpensePredictionService();
  });

  it('should return 0 for empty history', () => {
    expect(service.predictNextMonth([])).toBe(0);
  });

  it('should weight more recent months higher', () => {
    // weights: 1,2,3 → (100*1 + 200*2 + 300*3) / (1+2+3) = (100+400+900)/6 = 233.33...
    const prediction = service.predictNextMonth([
      { expense: 100 },
      { expense: 200 },
      { expense: 300 },
    ]);
    expect(prediction).toBeCloseTo(233.33, 1);
  });

  it('should return the single value when history has one point', () => {
    expect(service.predictNextMonth([{ expense: 500 }])).toBe(500);
  });
});

// ─── AIChatService (fallback — no OpenAI key) ────────────────────────────────

describe('AIChatService (rule-based fallback)', () => {
  let service: AIChatService;

  beforeEach(() => {
    service = new AIChatService(noKeyConfig);
  });

  it('should respond with balance info when context has totalBalance', async () => {
    const response = await service.chat('qual meu saldo?', { totalBalance: 5000 });
    expect(response.toLowerCase()).toContain('5000');
  });

  it('should respond with expense info when context has monthlyExpense', async () => {
    const response = await service.chat('quanto gastei?', { monthlyExpense: 2000 });
    expect(response.toLowerCase()).toContain('2000');
  });

  it('should compute savings rate from context', async () => {
    const response = await service.chat('como está minha economia?', { monthlyIncome: 5000, monthlyExpense: 4500 });
    expect(response).toContain('%');
  });

  it('should return budget info for orçamento question', async () => {
    const response = await service.chat('como funciona o orçamento?');
    expect(response.toLowerCase()).toContain('orçamento');
  });

  it('should return default message for unknown question', async () => {
    const response = await service.chat('bom dia');
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(10);
  });
});

// ─── AIInsightsService (unit) ─────────────────────────────────────────────────

describe('AIInsightsService', () => {
  let service: AIInsightsService;

  beforeEach(() => {
    service = new AIInsightsService(noKeyConfig);
  });

  it('should generate savings-rate alert when < 10%', async () => {
    const insights = await service.generateInsights(
      { income: 3000, expense: 2900, byCategory: {} },
      { income: 0, expense: 0 },
    );
    const tip = insights.find(i => i.type === 'saving_tip');
    expect(tip).toBeDefined();
    expect(tip?.message).toContain('poupança');
  });

  it('should generate overspend alert when expenses increased > 20%', async () => {
    const insights = await service.generateInsights(
      { income: 5000, expense: 4000, byCategory: {} },
      { income: 0, expense: 3000 },
    );
    const alert = insights.find(i => i.type === 'overspend_alert');
    expect(alert).toBeDefined();
  });

  it('should return empty array when finances are healthy', async () => {
    const insights = await service.generateInsights(
      { income: 10000, expense: 4000, byCategory: {} },
      { income: 0, expense: 4000 },
    );
    expect(insights).toHaveLength(0);
  });
});

// ─── AICategorizationUseCase ──────────────────────────────────────────────────

describe('AICategorizationUseCase', () => {
  let useCase: AICategorizationUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AICategorizationUseCase,
        { provide: CATEGORY_REPOSITORY,  useValue: mockCategoryRepo },
        { provide: AICategoryService,    useValue: mockCategoryService },
      ],
    }).compile();
    useCase = module.get<AICategorizationUseCase>(AICategorizationUseCase);
  });

  it('should fetch categories and call categorize service', async () => {
    mockCategoryRepo.findAll.mockResolvedValue([{ id: 'cat-1', name: 'Alimentação', type: 'EXPENSE' }]);
    mockCategoryService.categorize.mockResolvedValue({ categoryId: 'cat-1', categoryName: 'Alimentação', confidence: 0.9 });

    const result = await useCase.suggest('supermercado', 150, 'user-1');

    expect(mockCategoryRepo.findAll).toHaveBeenCalledWith({ userId: 'user-1', includeInactive: false });
    expect(result.categoryName).toBe('Alimentação');
  });
});

// ─── AIPredictionUseCase ──────────────────────────────────────────────────────

describe('AIPredictionUseCase', () => {
  let useCase: AIPredictionUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIPredictionUseCase,
        { provide: TRANSACTION_REPOSITORY,      useValue: mockTxRepo },
        { provide: AIExpensePredictionService,  useValue: mockPredictionService },
      ],
    }).compile();
    useCase = module.get<AIPredictionUseCase>(AIPredictionUseCase);
  });

  it('should aggregate 6 months of history and return prediction', async () => {
    mockTxRepo.sumByPeriod.mockResolvedValue(2000);
    mockPredictionService.predictNextMonth.mockReturnValue(2100.5);

    const result = await useCase.execute('user-1');

    expect(result.history).toHaveLength(6);
    expect(result.predictedNextMonth).toBe(2100.5);
    expect(mockTxRepo.sumByPeriod).toHaveBeenCalledTimes(6);
  });
});

// ─── AIChatUseCase ────────────────────────────────────────────────────────────

describe('AIChatUseCase', () => {
  let useCase: AIChatUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIChatUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTxRepo },
        { provide: ACCOUNT_REPOSITORY,     useValue: mockAccountRepo },
        { provide: GOAL_REPOSITORY,        useValue: mockGoalRepo },
        { provide: AIChatService,          useValue: mockChatService },
      ],
    }).compile();
    useCase = module.get<AIChatUseCase>(AIChatUseCase);
  });

  it('should build financial context including goals and call chat service', async () => {
    mockAccountRepo.findAllByUserId.mockResolvedValue([{ balance: 5000 }, { balance: 3000 }]);
    mockTxRepo.sumByPeriod
      .mockResolvedValueOnce(8000)  // income
      .mockResolvedValueOnce(3500); // expense
    mockTxRepo.findAll.mockResolvedValue({
      data: [
        { type: TransactionType.EXPENSE, categoryId: 'cat-1', amount: 1000 },
        { type: TransactionType.EXPENSE, categoryId: 'cat-2', amount: 800 },
        { type: TransactionType.INCOME,  categoryId: 'cat-3', amount: 8000 },
      ],
    });
    mockGoalRepo.findAllByUser.mockResolvedValue([
      {
        name: 'Viagem Europa', status: 'ACTIVE', targetDate: new Date(Date.now() + 30 * 86400000),
        progressPercent: () => 60, remainingAmount: () => 4000, isAchieved: () => false,
      },
    ]);
    mockChatService.chat.mockResolvedValue('Você está em bom caminho com sua meta!');

    const result = await useCase.execute('Estou no caminho certo com minhas metas?', 'user-1');

    expect(mockChatService.chat).toHaveBeenCalledWith(
      'Estou no caminho certo com minhas metas?',
      expect.objectContaining({
        totalBalance:   8000,
        monthlyIncome:  8000,
        monthlyExpense: 3500,
        goals: expect.arrayContaining([
          expect.objectContaining({ name: 'Viagem Europa', progressPercent: 60 }),
        ]),
      }),
    );
    expect(result.response).toBe('Você está em bom caminho com sua meta!');
  });
});
