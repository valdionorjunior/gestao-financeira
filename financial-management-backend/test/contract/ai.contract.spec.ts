/**
 * AI Contract Tests
 *
 * Verifica o contrato HTTP da API de inteligência artificial:
 * status codes, shapes de resposta, validação de corpo e repasse de userId.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AIController } from '@presentation/controllers/ai.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  AICategorizationUseCase, AIInsightsUseCase,
  AIPredictionUseCase, AIChatUseCase,
} from '@application/use-cases/ai/ai.use-cases';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockCategorize = { suggest: jest.fn() };
const mockInsights   = { execute: jest.fn() };
const mockPredict    = { execute: jest.fn() };
const mockChat       = { execute: jest.fn() };

const USER_ID = '22222222-2222-4222-a222-222222222222';

const CATEGORIZE_STUB = {
  categoryId:   '33333333-3333-4333-a333-333333333333',
  categoryName: 'Alimentação',
  confidence:   0.92,
};

const INSIGHTS_STUB = {
  savingsRate:    36,
  topExpenses:    [],
  suggestions:    ['Reduza gastos em restaurantes'],
  monthlyChange:  -5.2,
};

const PREDICTION_STUB = {
  predictedExpense: 3400,
  breakdown:        [],
  confidence:       0.78,
};

const CHAT_STUB = {
  response: 'Suas despesas do mês somam R$ 2.300,00...',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] AI API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AICategorizationUseCase, useValue: mockCategorize },
        { provide: AIInsightsUseCase,       useValue: mockInsights   },
        { provide: AIPredictionUseCase,     useValue: mockPredict    },
        { provide: AIChatUseCase,           useValue: mockChat       },
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  // ─── POST /ai/categorize ───────────────────────────────────────────────────

  describe('POST /api/v1/ai/categorize', () => {
    it('201 — retorna sugestão de categoria', async () => {
      mockCategorize.suggest.mockResolvedValue(CATEGORIZE_STUB);

      const res = await request(app.getHttpServer())
        .post('/api/v1/ai/categorize')
        .send({ description: 'Supermercado Extra', amount: 150.00 })
        .expect(201);

      expect(res.body).toMatchObject({ categoryName: 'Alimentação', confidence: 0.92 });
      expect(mockCategorize.suggest).toHaveBeenCalledWith(
        'Supermercado Extra', 150, USER_ID,
      );
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai/categorize')
        .send({})
        .expect(400);
    });

    it('400 — amount negativo retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai/categorize')
        .send({ description: 'Teste', amount: -50 })
        .expect(400);
    });
  });

  // ─── GET /ai/insights ─────────────────────────────────────────────────────

  describe('GET /api/v1/ai/insights', () => {
    it('200 — retorna insights financeiros do usuário', async () => {
      mockInsights.execute.mockResolvedValue(INSIGHTS_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/ai/insights')
        .expect(200);

      expect(res.body).toMatchObject({ savingsRate: 36 });
      expect(mockInsights.execute).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── GET /ai/predict ──────────────────────────────────────────────────────

  describe('GET /api/v1/ai/predict', () => {
    it('200 — retorna previsão de gastos', async () => {
      mockPredict.execute.mockResolvedValue(PREDICTION_STUB);

      const res = await request(app.getHttpServer())
        .get('/api/v1/ai/predict')
        .expect(200);

      expect(res.body).toMatchObject({ predictedExpense: 3400 });
      expect(mockPredict.execute).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── POST /ai/chat ────────────────────────────────────────────────────────

  describe('POST /api/v1/ai/chat', () => {
    it('200 (não 201) — resposta do assistente financeiro', async () => {
      mockChat.execute.mockResolvedValue(CHAT_STUB);

      const res = await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .send({ message: 'Quanto gastei este mês?' })
        .expect(200);

      expect(res.body).toMatchObject({ response: expect.any(String) });
      expect(mockChat.execute).toHaveBeenCalledWith(
        'Quanto gastei este mês?', USER_ID,
      );
    });

    it('400 — mensagem muito curta (< 3 chars)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .send({ message: 'ab' })
        .expect(400);
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .send({})
        .expect(400);
    });

    it('400 — mensagem muito longa (> 500 chars)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .send({ message: 'a'.repeat(501) })
        .expect(400);
    });
  });
});
