/**
 * Goal Contract Tests
 *
 * Verifica o contrato HTTP da API de metas financeiras:
 * status codes, shapes de resposta, validação, aportes.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { GoalController } from '@presentation/controllers/goal.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  CreateGoalUseCase, UpdateGoalUseCase,
  GetGoalUseCase, DeleteGoalUseCase,
  AddGoalContributionUseCase, GetGoalContributionsUseCase,
} from '@application/use-cases/goals/goal.use-cases';
import { NotFoundException } from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreate     = { execute: jest.fn() };
const mockUpdate     = { execute: jest.fn() };
const mockGet        = { findAll: jest.fn(), findOne: jest.fn() };
const mockDelete     = { execute: jest.fn() };
const mockAddContrib = { execute: jest.fn() };
const mockGetContrib = { execute: jest.fn() };

const GOAL_ID = '11111111-1111-4111-a111-111111111111';
const USER_ID = '22222222-2222-4222-a222-222222222222';

const GOAL_STUB = {
  id:            GOAL_ID,
  userId:        USER_ID,
  name:          'Viagem Europa',
  targetAmount:  15000,
  currentAmount: 3000,
  targetDate:    '2025-12-31',
  status:        'ACTIVE',
};

const CONTRIBUTION_STUB = {
  id:          '44444444-4444-4444-a444-444444444444',
  goalId:      GOAL_ID,
  amount:      500,
  description: 'Aporte mensal',
  date:        new Date().toISOString(),
};

const VALID_CREATE_BODY = {
  name:         'Viagem Europa',
  targetAmount: 15000,
  targetDate:   '2025-12-31',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] Goal API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [
        { provide: CreateGoalUseCase,             useValue: mockCreate     },
        { provide: UpdateGoalUseCase,             useValue: mockUpdate     },
        { provide: GetGoalUseCase,                useValue: mockGet        },
        { provide: DeleteGoalUseCase,             useValue: mockDelete     },
        { provide: AddGoalContributionUseCase,    useValue: mockAddContrib },
        { provide: GetGoalContributionsUseCase,   useValue: mockGetContrib },
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

  // ─── POST /goals ───────────────────────────────────────────────────────────

  describe('POST /api/v1/goals', () => {
    it('201 — cria meta', async () => {
      mockCreate.execute.mockResolvedValue(GOAL_STUB);

      const res = await request(app.getHttpServer())
        .post('/api/v1/goals')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body).toMatchObject({ id: GOAL_ID, name: 'Viagem Europa' });
      expect(mockCreate.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Viagem Europa' }),
        USER_ID,
      );
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/goals')
        .send({})
        .expect(400);
    });
  });

  // ─── GET /goals ────────────────────────────────────────────────────────────

  describe('GET /api/v1/goals', () => {
    it('200 — lista metas do usuário', async () => {
      mockGet.findAll.mockResolvedValue([GOAL_STUB]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/goals')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: GOAL_ID });
      expect(mockGet.findAll).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── GET /goals/:id ────────────────────────────────────────────────────────

  describe('GET /api/v1/goals/:id', () => {
    it('200 — retorna meta por ID', async () => {
      mockGet.findOne.mockResolvedValue(GOAL_STUB);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/goals/${GOAL_ID}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: GOAL_ID });
    });

    it('400 — ID inválido retorna validação', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/goals/bad-id')
        .expect(400);
    });

    it('404 — meta não encontrada', async () => {
      mockGet.findOne.mockRejectedValue(new NotFoundException('Meta não encontrada'));

      const res = await request(app.getHttpServer())
        .get(`/api/v1/goals/${GOAL_ID}`)
        .expect(404);

      expect(res.body).toHaveProperty('message');
    });
  });

  // ─── PUT /goals/:id ────────────────────────────────────────────────────────

  describe('PUT /api/v1/goals/:id', () => {
    it('200 — atualiza meta', async () => {
      mockUpdate.execute.mockResolvedValue({ ...GOAL_STUB, targetAmount: 20000 });

      const res = await request(app.getHttpServer())
        .put(`/api/v1/goals/${GOAL_ID}`)
        .send({ targetAmount: 20000 })
        .expect(200);

      expect(res.body).toMatchObject({ targetAmount: 20000 });
      expect(mockUpdate.execute).toHaveBeenCalledWith(
        GOAL_ID,
        expect.objectContaining({ targetAmount: 20000 }),
        USER_ID,
      );
    });
  });

  // ─── DELETE /goals/:id ─────────────────────────────────────────────────────

  describe('DELETE /api/v1/goals/:id', () => {
    it('204 — exclui meta', async () => {
      mockDelete.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/v1/goals/${GOAL_ID}`)
        .expect(204);

      expect(mockDelete.execute).toHaveBeenCalledWith(GOAL_ID, USER_ID);
    });
  });

  // ─── POST /goals/:id/contributions ────────────────────────────────────────

  describe('POST /api/v1/goals/:id/contributions', () => {
    it('201 — adiciona aporte à meta', async () => {
      mockAddContrib.execute.mockResolvedValue(CONTRIBUTION_STUB);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/goals/${GOAL_ID}/contributions`)
        .send({ amount: 500, notes: 'Aporte mensal', date: '2024-06-01' })
        .expect(201);

      expect(res.body).toMatchObject({ id: CONTRIBUTION_STUB.id, amount: 500 });
      expect(mockAddContrib.execute).toHaveBeenCalledWith(
        GOAL_ID,
        expect.objectContaining({ amount: 500 }),
        USER_ID,
      );
    });

    it('400 — corpo vazio retorna validação', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/goals/${GOAL_ID}/contributions`)
        .send({})
        .expect(400);
    });
  });

  // ─── GET /goals/:id/contributions ─────────────────────────────────────────

  describe('GET /api/v1/goals/:id/contributions', () => {
    it('200 — retorna aportes da meta', async () => {
      mockGetContrib.execute.mockResolvedValue([CONTRIBUTION_STUB]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/goals/${GOAL_ID}/contributions`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: CONTRIBUTION_STUB.id });
      expect(mockGetContrib.execute).toHaveBeenCalledWith(GOAL_ID, USER_ID);
    });
  });
});
