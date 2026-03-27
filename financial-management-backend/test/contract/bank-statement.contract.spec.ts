/**
 * Bank Statement Contract Tests
 *
 * Verifica o contrato HTTP da API de conciliação bancária:
 * status codes, shapes de resposta, upload multipart e validação de reconcile.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { BankStatementController } from '@presentation/controllers/bank-statement.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  ImportBankStatementUseCase, GetStatementItemsUseCase,
  ReconcileItemUseCase, ListBankStatementsUseCase,
} from '@application/use-cases/bank-statements/bank-statement.use-cases';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockImport     = { execute: jest.fn() };
const mockGetItems   = { execute: jest.fn() };
const mockList       = { execute: jest.fn() };
const mockReconcile  = { execute: jest.fn() };

const USER_ID        = '22222222-2222-4222-a222-222222222222';
const ACCOUNT_ID     = '33333333-3333-4333-a333-333333333333';
const STATEMENT_ID   = '44444444-4444-4444-a444-444444444444';
const ITEM_ID        = '55555555-5555-4555-a555-555555555555';
const TRANSACTION_ID = '66666666-6666-4666-a666-666666666666';

const STATEMENT_STUB = {
  id:        STATEMENT_ID,
  accountId: ACCOUNT_ID,
  userId:    USER_ID,
  fileName:  'extrato.ofx',
  itemCount: 5,
  status:    'IMPORTED',
};

const ITEM_STUB = {
  id:          ITEM_ID,
  statementId: STATEMENT_ID,
  date:        '2024-06-01',
  description: 'SUPERMERCADO',
  amount:      -150.50,
  status:      'PENDING',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('[Contract] BankStatement API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankStatementController],
      providers: [
        { provide: ImportBankStatementUseCase, useValue: mockImport    },
        { provide: GetStatementItemsUseCase,   useValue: mockGetItems  },
        { provide: ListBankStatementsUseCase,  useValue: mockList      },
        { provide: ReconcileItemUseCase,       useValue: mockReconcile },
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

  // ─── POST /bank-statements/import/:accountId ───────────────────────────────

  describe('POST /api/v1/bank-statements/import/:accountId', () => {
    it('201 — importa arquivo OFX e retorna extrato', async () => {
      mockImport.execute.mockResolvedValue(STATEMENT_STUB);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/import/${ACCOUNT_ID}`)
        .attach('file', Buffer.from('OFXHEADER:100'), 'extrato.ofx')
        .expect(201);

      expect(res.body).toMatchObject({ id: STATEMENT_ID, fileName: 'extrato.ofx' });
      expect(mockImport.execute).toHaveBeenCalledWith(
        expect.objectContaining({ originalname: 'extrato.ofx' }),
        ACCOUNT_ID,
        USER_ID,
      );
    });

    it('400 — accountId inválido retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bank-statements/import/not-a-uuid')
        .attach('file', Buffer.from(''), 'empty.ofx')
        .expect(400);
    });
  });

  // ─── GET /bank-statements ─────────────────────────────────────────────────

  describe('GET /api/v1/bank-statements', () => {
    it('200 — lista extratos importados pelo usuário', async () => {
      mockList.execute.mockResolvedValue([STATEMENT_STUB]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/bank-statements')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: STATEMENT_ID });
      expect(mockList.execute).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── GET /bank-statements/:id/items ───────────────────────────────────────

  describe('GET /api/v1/bank-statements/:id/items', () => {
    it('200 — retorna itens do extrato', async () => {
      mockGetItems.execute.mockResolvedValue([ITEM_STUB]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bank-statements/${STATEMENT_ID}/items`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toMatchObject({ id: ITEM_ID, description: 'SUPERMERCADO' });
      expect(mockGetItems.execute).toHaveBeenCalledWith(STATEMENT_ID, USER_ID);
    });

    it('400 — ID inválido retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/bank-statements/bad-id/items')
        .expect(400);
    });
  });

  // ─── POST /bank-statements/:id/items/:itemId/reconcile ────────────────────

  describe('POST /api/v1/bank-statements/:id/items/:itemId/reconcile', () => {
    it('201 — reconcilia item com ação "match"', async () => {
      const reconcileResult = { ...ITEM_STUB, status: 'MATCHED', transactionId: TRANSACTION_ID };
      mockReconcile.execute.mockResolvedValue(reconcileResult);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/${STATEMENT_ID}/items/${ITEM_ID}/reconcile`)
        .send({ action: 'match', transactionId: TRANSACTION_ID })
        .expect(201);

      expect(res.body).toMatchObject({ status: 'MATCHED' });
      expect(mockReconcile.execute).toHaveBeenCalledWith(
        STATEMENT_ID, ITEM_ID, 'match', USER_ID, TRANSACTION_ID, undefined,
      );
    });

    it('201 — reconcilia item com ação "create"', async () => {
      mockReconcile.execute.mockResolvedValue({ ...ITEM_STUB, status: 'CREATED' });

      await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/${STATEMENT_ID}/items/${ITEM_ID}/reconcile`)
        .send({ action: 'create' })
        .expect(201);

      expect(mockReconcile.execute).toHaveBeenCalledWith(
        STATEMENT_ID, ITEM_ID, 'create', USER_ID, undefined, undefined,
      );
    });

    it('201 — reconcilia item com ação "ignore"', async () => {
      mockReconcile.execute.mockResolvedValue({ ...ITEM_STUB, status: 'IGNORED' });

      await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/${STATEMENT_ID}/items/${ITEM_ID}/reconcile`)
        .send({ action: 'ignore' })
        .expect(201);
    });

    it('400 — ação inválida retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/${STATEMENT_ID}/items/${ITEM_ID}/reconcile`)
        .send({ action: 'delete' })
        .expect(400);
    });

    it('400 — corpo vazio retorna erro de validação', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/${STATEMENT_ID}/items/${ITEM_ID}/reconcile`)
        .send({})
        .expect(400);
    });

    it('400 — ID do extrato inválido', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/bank-statements/bad-id/items/${ITEM_ID}/reconcile`)
        .send({ action: 'ignore' })
        .expect(400);
    });
  });
});
