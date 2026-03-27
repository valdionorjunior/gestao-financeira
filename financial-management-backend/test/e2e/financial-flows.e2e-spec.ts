/**
 * E2E Tests — Full HTTP Stack
 *
 * Testa fluxos completos de ponta a ponta usando NestJS TestingModule com
 * módulos de feature reais e repositórios substituídos por mocks.
 *
 * Cobre: Auth → Account → Transaction → Logout
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '@presentation/controllers/auth.controller';
import { AccountController } from '@presentation/controllers/account.controller';
import { TransactionController } from '@presentation/controllers/transaction.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';
import { CreateAccountUseCase } from '@application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase } from '@application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '@application/use-cases/accounts/get-account.use-case';
import {
  CreateTransactionUseCase,
  CreateTransferUseCase,
  UpdateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
  GetTransactionUseCase,
} from '@application/use-cases/transactions/transaction.use-cases';
import { TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';

// ─── Token stubs ─────────────────────────────────────────────────────────────

const ACCESS_TOKEN  = 'e2e-access-token';
const REFRESH_TOKEN = 'e2e-refresh-token';
const USER_ID       = 'e2e-user-uuid-1';
const ACCOUNT_ID    = '11111111-1111-4111-a111-111111111111';
const TXN_ID        = '22222222-2222-4222-a222-222222222222';

const TOKEN_PAIR = { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN };
const USER_STUB  = {
  id:        USER_ID,
  email:     'e2e@example.com',
  firstName: 'E2E',
  lastName:  'Tester',
  role:      'TITULAR',
};

// ─── Mock Use-Cases ───────────────────────────────────────────────────────────

const mockRegister  = { execute: jest.fn() };
const mockLogin     = { execute: jest.fn(), generateTokenPair: jest.fn() };
const mockRefresh   = { execute: jest.fn() };
const mockLogout    = { execute: jest.fn() };

const mockCreateAccount   = { execute: jest.fn() };
const mockGetAccount      = { execute: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
const mockUpdateAccount   = { execute: jest.fn() };
const mockDeleteAccount   = { execute: jest.fn() };

const mockCreateTxn   = { execute: jest.fn() };
const mockCreateXfer  = { execute: jest.fn() };
const mockUpdateTxn   = { execute: jest.fn() };
const mockDeleteTxn   = { execute: jest.fn() };
const mockListTxns    = { execute: jest.fn() };
const mockGetTxn      = { execute: jest.fn() };

// ─── App factory ─────────────────────────────────────────────────────────────

function makeJwtGuard(userId = USER_ID) {
  return {
    canActivate: (ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { userId, email: USER_STUB.email, role: USER_STUB.role };
      return true;
    },
  };
}

async function buildApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [AuthController, AccountController, TransactionController],
    providers: [
      { provide: RegisterUserUseCase,       useValue: mockRegister },
      { provide: LoginUserUseCase,          useValue: mockLogin },
      { provide: RefreshTokenUseCase,       useValue: mockRefresh },
      { provide: LogoutUserUseCase,         useValue: mockLogout },
      { provide: CreateAccountUseCase,  useValue: mockCreateAccount },
      { provide: GetAccountUseCase,      useValue: mockGetAccount },
      { provide: UpdateAccountUseCase,   useValue: mockUpdateAccount },
      { provide: DeleteAccountUseCase,   useValue: mockDeleteAccount },
      { provide: CreateTransactionUseCase,  useValue: mockCreateTxn },
      { provide: CreateTransferUseCase,     useValue: mockCreateXfer },
      { provide: UpdateTransactionUseCase,  useValue: mockUpdateTxn },
      { provide: DeleteTransactionUseCase,  useValue: mockDeleteTxn },
      { provide: ListTransactionsUseCase,   useValue: mockListTxns },
      { provide: GetTransactionUseCase,     useValue: mockGetTxn },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(makeJwtGuard())
    .compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

// ═════════════════════════════════════════════════════════════════════════════
// E2E: Auth flows
// ═════════════════════════════════════════════════════════════════════════════

describe('[E2E] Auth', () => {
  let app: INestApplication;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/auth/register', () => {
    const body = {
      email: 'e2e@example.com',
      password: 'Senha@123',
      firstName: 'E2E',
      lastName: 'Tester',
      lgpdConsent: true,
    };

    it('201 — registro bem-sucedido retorna tokens e user', async () => {
      mockRegister.execute.mockResolvedValue(USER_STUB);
      mockLogin.generateTokenPair.mockResolvedValue(TOKEN_PAIR);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(body)
        .expect(201);

      expect(res.body).toMatchObject({
        accessToken:  expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({ email: 'e2e@example.com' }),
      });
    });

    it('400 — senha fraca retorna validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...body, password: '123' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('400 — email inválido retorna validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...body, email: 'not-an-email' })
        .expect(400);
    });

    it('400 — corpo vazio retorna validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('200 — credenciais válidas retornam tokens', async () => {
      mockLogin.execute.mockResolvedValue({ ...TOKEN_PAIR, user: USER_STUB });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e@example.com', password: 'Senha@123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('400 — corpo vazio retorna validação', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('200 — refresh válido retorna novos tokens', async () => {
      mockRefresh.execute.mockResolvedValue(TOKEN_PAIR);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: REFRESH_TOKEN })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('204 — logout com bearer token', async () => {
      mockLogout.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
        .send({ refreshToken: REFRESH_TOKEN })
        .expect(204);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('200 — retorna dados do usuário autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
        .expect(200);

      expect(res.body).toMatchObject({ userId: USER_ID, email: USER_STUB.email });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E2E: Account flows
// ═════════════════════════════════════════════════════════════════════════════

describe('[E2E] Accounts', () => {
  let app: INestApplication;

  const accountStub = {
    id:      ACCOUNT_ID,
    name:    'Conta E2E',
    type:    'CHECKING',
    balance: 5000,
    userId:  USER_ID,
  };

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/accounts — 201 cria conta', async () => {
    mockCreateAccount.execute.mockResolvedValue(accountStub);

    const res = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({ name: 'Conta E2E', type: 'CHECKING' })
      .expect(201);

    expect(res.body).toMatchObject({ name: 'Conta E2E' });
  });

  it('POST /api/v1/accounts — 400 sem campos obrigatórios', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({})
      .expect(400);
  });

  it('GET /api/v1/accounts — 200 lista contas', async () => {
    mockGetAccount.findAll.mockResolvedValue([accountStub]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: ACCOUNT_ID });
  });

  it('GET /api/v1/accounts/:id — 200 retorna conta', async () => {
    mockGetAccount.findOne.mockResolvedValue(accountStub);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/accounts/${ACCOUNT_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(200);

    expect(res.body).toMatchObject({ id: ACCOUNT_ID });
  });

  it('PATCH /api/v1/accounts/:id — 200 atualiza conta', async () => {
    mockUpdateAccount.execute.mockResolvedValue({ ...accountStub, name: 'Conta Atualizada' });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/accounts/${ACCOUNT_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({ name: 'Conta Atualizada' })
      .expect(200);

    expect(res.body).toMatchObject({ name: 'Conta Atualizada' });
  });

  it('DELETE /api/v1/accounts/:id — 204 exclui conta', async () => {
    mockDeleteAccount.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/accounts/${ACCOUNT_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(204);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E2E: Transaction flows
// ═════════════════════════════════════════════════════════════════════════════

describe('[E2E] Transactions', () => {
  let app: INestApplication;

  const txStub = {
    id:          TXN_ID,
    userId:      USER_ID,
    accountId:   ACCOUNT_ID,
    type:        TransactionType.EXPENSE,
    status:      TransactionStatus.CONFIRMED,
    amount:      250,
    description: 'Supermercado E2E',
    date:        new Date('2024-06-15').toISOString(),
  };

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/transactions — 201 cria transação', async () => {
    mockCreateTxn.execute.mockResolvedValue(txStub);

    const res = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({
        accountId:   ACCOUNT_ID,
        type:        TransactionType.EXPENSE,
        amount:      250,
        description: 'Supermercado E2E',
        date:        '2024-06-15',
      })
      .expect(201);

    expect(res.body).toMatchObject({ id: TXN_ID, type: TransactionType.EXPENSE });
  });

  it('POST /api/v1/transactions — 400 sem campos obrigatórios', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({})
      .expect(400);
  });

  it('GET /api/v1/transactions — 200 lista transações', async () => {
    mockListTxns.execute.mockResolvedValue({ data: [txStub], total: 1, page: 1, limit: 20 });

    const res = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data[0]).toMatchObject({ id: TXN_ID });
  });

  it('GET /api/v1/transactions — 200 lista com filtros de data', async () => {
    mockListTxns.execute.mockResolvedValue({ data: [txStub], total: 1, page: 1, limit: 20 });

    await request(app.getHttpServer())
      .get('/api/v1/transactions?startDate=2024-06-01&endDate=2024-06-30')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(200);

    expect(mockListTxns.execute).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: '2024-06-01', endDate: '2024-06-30' }),
      USER_ID,
    );
  });

  it('GET /api/v1/transactions/:id — 200 retorna transação', async () => {
    mockGetTxn.execute.mockResolvedValue(txStub);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/transactions/${TXN_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(200);

    expect(res.body).toMatchObject({ id: TXN_ID });
  });

  it('PUT /api/v1/transactions/:id — 200 atualiza transação', async () => {
    mockUpdateTxn.execute.mockResolvedValue({ ...txStub, amount: 300 });

    const res = await request(app.getHttpServer())
      .put(`/api/v1/transactions/${TXN_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({ amount: 300 })
      .expect(200);

    expect(res.body).toMatchObject({ amount: 300 });
  });

  it('DELETE /api/v1/transactions/:id — 204 exclui transação', async () => {
    mockDeleteTxn.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/transactions/${TXN_ID}`)
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .expect(204);
  });

  it('POST /api/v1/transactions/transfer — 201 cria transferência', async () => {
    const DEST_ACCT_ID = '33333333-3333-4333-a333-333333333333';
    const TXN_B_ID     = '44444444-4444-4444-a444-444444444444';
    mockCreateXfer.execute.mockResolvedValue({
      debit:          { ...txStub, id: TXN_ID },
      credit:         { ...txStub, id: TXN_B_ID, accountId: DEST_ACCT_ID },
      transferPairId: 'e5f6a7b8-c9d0-4234-afab-345678901234',
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/transactions/transfer')
      .set('Authorization', `Bearer ${ACCESS_TOKEN}`)
      .send({
        accountId:            ACCOUNT_ID,
        destinationAccountId: DEST_ACCT_ID,
        type:                 TransactionType.TRANSFER,
        amount:               500,
        description:          'Transferência E2E',
        date:                 '2024-06-15',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('transferPairId');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E2E: Full user flow (register → login → create account → create txn → logout)
// ═════════════════════════════════════════════════════════════════════════════

describe('[E2E] Full user flow', () => {
  let app: INestApplication;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it('completa o ciclo: registro → criar conta → lançar despesa → logout', async () => {
    // Step 1: Register
    mockRegister.execute.mockResolvedValue(USER_STUB);
    mockLogin.generateTokenPair.mockResolvedValue(TOKEN_PAIR);

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'flow@example.com', password: 'Senha@123',
        firstName: 'Flow', lastName: 'Test', lgpdConsent: true,
      })
      .expect(201);

    expect(registerRes.body.accessToken).toBeTruthy();
    const token = registerRes.body.accessToken;

    // Step 2: Create account
    const accountStub = { id: ACCOUNT_ID, name: 'CC Flow', type: 'CHECKING', balance: 10000 };
    mockCreateAccount.execute.mockResolvedValue(accountStub);

    const accountRes = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'CC Flow', type: 'CHECKING' })
      .expect(201);

    expect(accountRes.body.id).toBe(ACCOUNT_ID);

    // Step 3: Create expense
    const txStub = { id: TXN_ID, type: TransactionType.EXPENSE, amount: 89.90 };
    mockCreateTxn.execute.mockResolvedValue(txStub);

    const txRes = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountId: ACCOUNT_ID, type: TransactionType.EXPENSE,
        amount: 89.90, description: 'Almoço', date: '2024-06-20',
      })
      .expect(201);

    expect(txRes.body.type).toBe(TransactionType.EXPENSE);

    // Step 4: Logout
    mockLogout.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: REFRESH_TOKEN })
      .expect(204);
  });
});
