/**
 * Budget Contract Tests
 *
 * Verifica o contrato HTTP da API de orçamentos:
 * status codes, shapes de resposta, validação de entrada e tratamento de erros.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { BudgetController } from '@presentation/controllers/budget.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateBudgetUseCase, UpdateBudgetUseCase,
  GetBudgetUseCase, DeleteBudgetUseCase,
} from '@application/use-cases/budgets/budget.use-cases';
import { NotFoundException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreate = { execute: jest.fn() };
const mockUpdate = { execute: jest.fn() };
const mockGet    = { findAll: jest.fn(), findOne: jest.fn() };
const mockDelete = { execute: jest.fn() };

const BUDGET_ID = '11111111-1111-4111-a111-111111111111';
const USER_ID   = '22222222-2222-4222-a222-222222222222';
const CAT_ID    = '33333333-3333-4333-a333-333333333333';

const BUDGET_STUB = {
  id:         BUDGET_ID,
  userId:     USER_ID,
  categoryId: CAT_ID,
  name:       'Alimentação',
  period:     'MONTHLY',
  amount:     1500,
  spent:      0,
  isActive:   true,
};

const VALID_CREATE_BODY = {
  categoryId: CAT_ID,
  name:       'Alimentação',
  period:     'MONTHLY',
  amount:     1500,
  startDate:  '2024-01-01',
  endDate:    '2024-01-31',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] Budget API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        { provide: CreateBudgetUseCase, useValue: mockCreate },
        { provide: UpdateBudgetUseCase, useValue: mockUpdate },
        { provide: GetBudgetUseCase,    useValue: mockGet    },
        { provide: DeleteBudgetUseCase, useValue: mockDelete },
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

  // ─── POST /budgets ─────────────────────────────────────────────────────────

  describe('POST /api/v1/budgets', () => {
    it('201 — cria orçamento e retorna objeto criado', async () => {
      mockCreate.execute.mockResolvedValue(BUDGET_STUB);

      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body).toMatchObject({ id: BUDGET_ID, name: 'Alimentação' });
      expect(mockCreate.execute).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: CAT_ID }),
        USER_ID,
      );
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  // ─── GET /budgets ──────────────────────────────────────────────────────────

  describe('GET /api/v1/budgets', () => {
    it('200 — lista orçamentos sem filtro', async () => {
      mockGet.findAll.mockResolvedValue([BUDGET_STUB]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/budgets')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: BUDGET_ID });
      expect(mockGet.findAll).toHaveBeenCalledWith(USER_ID, undefined);
    });

    it('200 — lista orçamentos com filtro active=true', async () => {
      mockGet.findAll.mockResolvedValue([BUDGET_STUB]);

      await request(app.getHttpServer())
        .get('/api/v1/budgets?active=true')
        .expect(200);

      expect(mockGet.findAll).toHaveBeenCalledWith(USER_ID, true);
    });

    it('200 — lista orçamentos com filtro active=false', async () => {
      mockGet.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/budgets?active=false')
        .expect(200);

      expect(mockGet.findAll).toHaveBeenCalledWith(USER_ID, false);
    });
  });

  // ─── GET /budgets/:id ──────────────────────────────────────────────────────

  describe('GET /api/v1/budgets/:id', () => {
    it('200 — retorna orçamento por ID', async () => {
      mockGet.findOne.mockResolvedValue(BUDGET_STUB);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${BUDGET_ID}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: BUDGET_ID });
    });

    it('400 — ID inválido (não UUID) retorna validação', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/budgets/not-a-uuid')
        .expect(400);
    });

    it('404 — orçamento não encontrado retorna JSON padronizado', async () => {
      mockGet.findOne.mockRejectedValue(new NotFoundException('Orçamento não encontrado'));

      const res = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${BUDGET_ID}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  // ─── PUT /budgets/:id ──────────────────────────────────────────────────────

  describe('PUT /api/v1/budgets/:id', () => {
    it('200 — atualiza orçamento', async () => {
      mockUpdate.execute.mockResolvedValue({ ...BUDGET_STUB, amount: 2000 });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/budgets/${BUDGET_ID}`)
        .send({ amount: 2000 })
        .expect(200);

      expect(res.body).toMatchObject({ amount: 2000 });
      expect(mockUpdate.execute).toHaveBeenCalledWith(BUDGET_ID, expect.objectContaining({ amount: 2000 }), USER_ID);
    });

    it('400 — ID inválido retorna validação', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/budgets/bad-id')
        .send({ amount: 100 })
        .expect(400);
    });
  });

  // ─── DELETE /budgets/:id ───────────────────────────────────────────────────

  describe('DELETE /api/v1/budgets/:id', () => {
    it('204 — exclui orçamento', async () => {
      mockDelete.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/budgets/${BUDGET_ID}`)
        .expect(204);

      expect(mockDelete.execute).toHaveBeenCalledWith(BUDGET_ID, USER_ID);
    });

    it('400 — ID inválido retorna validação', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/budgets/bad-id')
        .expect(400);
    });
  });
});
