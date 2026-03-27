/**
 * Account Contract Tests
 *
 * Verifica o contrato HTTP da API de contas:
 * autenticação obrigatória, validação de entrada, status codes e shapes de resposta.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AccountController } from '@presentation/controllers/account.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CreateAccountUseCase } from '@application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase } from '@application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '@application/use-cases/accounts/get-account.use-case';
import { AccountType } from '@domain/entities/account.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreateUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockGetUseCase = { findAll: jest.fn(), findOne: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const ACCOUNT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const USER_ID = 'u1b2c3d4-e5f6-7890-abcd-ef1234567890';

const VALID_CREATE_BODY = {
  name: 'Conta Corrente Nubank',
  type: AccountType.CHECKING,
  bankName: 'Nubank',
  initialBalance: 1000,
  currency: 'BRL',
};

const ACCOUNT_RESPONSE = {
  id: ACCOUNT_ID,
  userId: USER_ID,
  name: 'Conta Corrente Nubank',
  type: AccountType.CHECKING,
  balance: 1000,
  currency: 'BRL',
  isActive: true,
  includeInTotal: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('[Contract] Account API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: CreateAccountUseCase, useValue: mockCreateUseCase },
        { provide: UpdateAccountUseCase, useValue: mockUpdateUseCase },
        { provide: GetAccountUseCase, useValue: mockGetUseCase },
        { provide: DeleteAccountUseCase, useValue: mockDeleteUseCase },
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

  // ─── GET /accounts ─────────────────────────────────────────────────────────

  describe('GET /api/v1/accounts', () => {
    it('200 — retorna array de contas do usuário', async () => {
      mockGetUseCase.findAll.mockResolvedValue([ACCOUNT_RESPONSE]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/accounts')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        balance: expect.any(Number),
      });
      expect(mockGetUseCase.findAll).toHaveBeenCalledWith(USER_ID);
    });

    it('200 — retorna array vazio quando não há contas', async () => {
      mockGetUseCase.findAll.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/accounts')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ─── POST /accounts ────────────────────────────────────────────────────────

  describe('POST /api/v1/accounts', () => {
    it('201 — cria conta e retorna objeto completo', async () => {
      mockCreateUseCase.execute.mockResolvedValue(ACCOUNT_RESPONSE);

      const res = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        balance: expect.any(Number),
      });
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: VALID_CREATE_BODY.name }),
        USER_ID,
      );
    });

    it('400 — nome ausente falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .send({ type: AccountType.CHECKING })
        .expect(400);

      expect(res.body).toMatchObject({
        status: 400,
        path: '/api/v1/accounts',
        timestamp: expect.any(String),
      });
    });

    it('400 — type inválido falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .send({ name: 'Conta', type: 'INVALID_TYPE' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('409 — nome duplicado retorna ConflictException', async () => {
      mockCreateUseCase.execute.mockRejectedValue(
        new ConflictException('Conta "Conta Corrente Nubank" já existe'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .send(VALID_CREATE_BODY)
        .expect(409);

      expect(res.body).toMatchObject({
        status: 409,
        error: expect.any(String),
        message: expect.stringContaining('já existe'),
      });
    });
  });

  // ─── GET /accounts/:id ────────────────────────────────────────────────────

  describe('GET /api/v1/accounts/:id', () => {
    it('200 — retorna conta específica pelo ID', async () => {
      mockGetUseCase.findOne.mockResolvedValue(ACCOUNT_RESPONSE);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${ACCOUNT_ID}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: ACCOUNT_ID,
        name: expect.any(String),
      });
      expect(mockGetUseCase.findOne).toHaveBeenCalledWith(ACCOUNT_ID, USER_ID);
    });

    it('400 — UUID inválido retorna erro de validação', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/accounts/not-a-valid-uuid')
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('404 — conta não encontrada retorna NotFoundException', async () => {
      mockGetUseCase.findOne.mockRejectedValue(
        new NotFoundException('Conta não encontrada'),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/accounts/${ACCOUNT_ID}`)
        .expect(404);

      expect(res.body).toMatchObject({
        status: 404,
        message: expect.any(String),
      });
    });
  });

  // ─── PATCH /accounts/:id ──────────────────────────────────────────────────

  describe('PATCH /api/v1/accounts/:id', () => {
    it('200 — atualiza conta e retorna dado atualizado', async () => {
      const updated = { ...ACCOUNT_RESPONSE, name: 'Conta Atualizada' };
      mockUpdateUseCase.execute.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/accounts/${ACCOUNT_ID}`)
        .send({ name: 'Conta Atualizada' })
        .expect(200);

      expect(res.body.name).toBe('Conta Atualizada');
    });

    it('400 — UUID inválido no PATCH', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/accounts/bad-id')
        .send({ name: 'X' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });
  });

  // ─── DELETE /accounts/:id ─────────────────────────────────────────────────

  describe('DELETE /api/v1/accounts/:id', () => {
    it('204 — exclusão retorna sem corpo de resposta', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/accounts/${ACCOUNT_ID}`)
        .expect(204);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(ACCOUNT_ID, USER_ID);
    });

    it('400 — UUID inválido no DELETE', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/accounts/invalid-uuid')
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('404 — conta não encontrada antes de excluir', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(
        new NotFoundException('Conta não encontrada'),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/accounts/${ACCOUNT_ID}`)
        .expect(404);

      expect(res.body.status).toBe(404);
    });
  });
});
