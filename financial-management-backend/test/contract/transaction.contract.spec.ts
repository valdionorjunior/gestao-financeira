/**
 * Transaction Contract Tests
 *
 * Verifica o contrato HTTP da API de transações:
 * validação de entrada, status codes, shapes de resposta e paginação.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TransactionController } from '@presentation/controllers/transaction.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateTransactionUseCase,
  CreateTransferUseCase,
  UpdateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
  GetTransactionUseCase,
} from '@application/use-cases/transactions/transaction.use-cases';
import { TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';
import { NotFoundException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreateUseCase   = { execute: jest.fn() };
const mockTransferUseCase = { execute: jest.fn() };
const mockUpdateUseCase   = { execute: jest.fn() };
const mockDeleteUseCase   = { execute: jest.fn() };
const mockListUseCase     = { execute: jest.fn() };
const mockGetUseCase      = { execute: jest.fn() };

const ACCOUNT_ID     = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TRANSACTION_ID = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';
const USER_ID        = 'c1b2c3d4-e5f6-7890-abcd-ef1234567890';

const VALID_CREATE_BODY = {
  type: TransactionType.EXPENSE,
  accountId: ACCOUNT_ID,
  amount: 150.50,
  description: 'Supermercado',
  date: '2024-01-15',
};

const TRANSACTION_RESPONSE = {
  id: TRANSACTION_ID,
  userId: USER_ID,
  accountId: ACCOUNT_ID,
  type: TransactionType.EXPENSE,
  status: TransactionStatus.CONFIRMED,
  amount: 150.50,
  description: 'Supermercado',
  date: '2024-01-15T00:00:00.000Z',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('[Contract] Transaction API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        { provide: CreateTransactionUseCase, useValue: mockCreateUseCase },
        { provide: CreateTransferUseCase,    useValue: mockTransferUseCase },
        { provide: UpdateTransactionUseCase, useValue: mockUpdateUseCase },
        { provide: DeleteTransactionUseCase, useValue: mockDeleteUseCase },
        { provide: ListTransactionsUseCase,  useValue: mockListUseCase },
        { provide: GetTransactionUseCase,    useValue: mockGetUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: USER_ID, email: 'joao@example.com', role: 'TITULAR' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /transactions ────────────────────────────────────────────────────

  describe('POST /api/v1/transactions', () => {
    it('201 — cria transação e retorna objeto completo', async () => {
      mockCreateUseCase.execute.mockResolvedValue(TRANSACTION_RESPONSE);

      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        type: TransactionType.EXPENSE,
        amount: expect.any(Number),
        description: expect.any(String),
      });
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 150.50 }),
        USER_ID,
      );
    });

    it('400 — amount ausente falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ type: TransactionType.EXPENSE, accountId: ACCOUNT_ID, description: 'X', date: '2024-01-15' })
        .expect(400);

      expect(res.body).toMatchObject({
        status: 400,
        path: '/api/v1/transactions',
        timestamp: expect.any(String),
      });
    });

    it('400 — type inválido falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ ...VALID_CREATE_BODY, type: 'INVALID' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('400 — amount negativo falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ ...VALID_CREATE_BODY, amount: -50 })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('400 — accountId não é UUID válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ ...VALID_CREATE_BODY, accountId: 'not-uuid' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('400 — data em formato inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({ ...VALID_CREATE_BODY, date: '15/01/2024' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });
  });

  // ─── POST /transactions/transfer ─────────────────────────────────────────

  describe('POST /api/v1/transactions/transfer', () => {
    it('201 — cria transferência entre contas', async () => {
      mockTransferUseCase.execute.mockResolvedValue(TRANSACTION_RESPONSE);

      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions/transfer')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
      });
    });
  });

  // ─── GET /transactions ─────────────────────────────────────────────────────

  describe('GET /api/v1/transactions', () => {
    it('200 — retorna resultado paginado', async () => {
      const paginatedResult = {
        data: [TRANSACTION_RESPONSE],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockListUseCase.execute.mockResolvedValue(paginatedResult);

      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .expect(200);

      expect(res.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('200 — aceita filtros de query: type, startDate, endDate', async () => {
      mockListUseCase.execute.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ type: TransactionType.EXPENSE, startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(200);

      expect(mockListUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ type: TransactionType.EXPENSE }),
        USER_ID,
      );
      expect(res.body).toBeDefined();
    });
  });

  // ─── GET /transactions/:id ────────────────────────────────────────────────

  describe('GET /api/v1/transactions/:id', () => {
    it('200 — retorna transação pelo ID', async () => {
      mockGetUseCase.execute.mockResolvedValue(TRANSACTION_RESPONSE);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${TRANSACTION_ID}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: TRANSACTION_ID,
        amount: expect.any(Number),
      });
    });

    it('400 — UUID inválido', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/transactions/not-a-uuid')
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('404 — transação não encontrada', async () => {
      mockGetUseCase.execute.mockRejectedValue(
        new NotFoundException('Transação não encontrada'),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${TRANSACTION_ID}`)
        .expect(404);

      expect(res.body.status).toBe(404);
    });
  });

  // ─── PUT /transactions/:id ────────────────────────────────────────────────

  describe('PUT /api/v1/transactions/:id', () => {
    it('200 — atualiza transação e retorna dado atualizado', async () => {
      const updated = { ...TRANSACTION_RESPONSE, description: 'Farmácia' };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .put(`/api/v1/transactions/${TRANSACTION_ID}`)
        .send({ description: 'Farmácia' })
        .expect(200);

      expect(res.body.description).toBe('Farmácia');
    });
  });

  // ─── DELETE /transactions/:id ─────────────────────────────────────────────

  describe('DELETE /api/v1/transactions/:id', () => {
    it('204 — exclusão bem-sucedida sem corpo', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${TRANSACTION_ID}`)
        .expect(204);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(TRANSACTION_ID, USER_ID);
    });

    it('404 — transação não encontrada para exclusão', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(
        new NotFoundException('Transação não encontrada'),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${TRANSACTION_ID}`)
        .expect(404);

      expect(res.body.status).toBe(404);
    });
  });
});
