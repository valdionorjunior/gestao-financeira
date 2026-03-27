/**
 * Auth Contract Tests
 *
 * Verifica o contrato HTTP da API de autenticação:
 * status codes, shape das respostas, validações de entrada e formato de erros.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '@presentation/controllers/auth.controller';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockRegisterUseCase = { execute: jest.fn() };
const mockLoginUseCase = { execute: jest.fn(), generateTokenPair: jest.fn() };
const mockRefreshUseCase = { execute: jest.fn() };
const mockLogoutUseCase = { execute: jest.fn() };

const VALID_REGISTER_BODY = {
  email: 'joao@example.com',
  password: 'Senha@123',
  firstName: 'João',
  lastName: 'Silva',
  lgpdConsent: true,
};

const TOKEN_PAIR = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.access',
  refreshToken: 'eyJhbGciOiJIUzI1NiJ9.refresh',
};

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('[Contract] Auth API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUserUseCase, useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshUseCase },
        { provide: LogoutUserUseCase, useValue: mockLogoutUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'user-uuid-1', email: 'joao@example.com', role: 'TITULAR' };
        return true;
      }})
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

  // ─── POST /auth/register ───────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('201 — retorna accessToken, refreshToken e user object', async () => {
      const user = { id: 'u-1', email: 'joao@example.com', firstName: 'João', lastName: 'Silva', role: 'TITULAR' };
      mockRegisterUseCase.execute.mockResolvedValue(user);
      mockLoginUseCase.generateTokenPair.mockResolvedValue(TOKEN_PAIR);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_BODY)
        .expect(201);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(String),
          email: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          role: expect.any(String),
        },
      });
    });

    it('400 — missing required fields retorna erro padronizado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'invalido' })
        .expect(400);

      expect(res.body).toMatchObject({
        status: 400,
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/api/v1/auth/register',
      });
      // message pode ser string ou array de strings de validação
      expect(res.body.message).toBeDefined();
    });

    it('400 — senha fraca falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_BODY, password: '12345678' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('400 — e-mail inválido falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_BODY, email: 'nao-e-email' })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('400 — lgpdConsent=false retorna BadRequestException', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new BadRequestException('Consentimento LGPD é obrigatório'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_BODY, lgpdConsent: false })
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('409 — e-mail duplicado retorna ConflictException', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new ConflictException('E-mail já cadastrado'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_BODY)
        .expect(409);

      expect(res.body).toMatchObject({
        status: 409,
        message: 'E-mail já cadastrado',
      });
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('200 — credenciais válidas retorna tokens e user', async () => {
      mockLoginUseCase.execute.mockResolvedValue({
        ...TOKEN_PAIR,
        user: { id: 'u-1', email: 'joao@example.com', firstName: 'João', lastName: 'Silva', role: 'TITULAR' },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'joao@example.com', password: 'Senha@123' })
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({ email: expect.any(String) }),
      });
    });

    it('400 — body vazio retorna erro de validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(res.body.status).toBe(400);
      expect(res.body.path).toBe('/api/v1/auth/login');
    });

    it('401 — credenciais inválidas retorna UnauthorizedException', async () => {
      mockLoginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'joao@example.com', password: 'SenhaErrada@1' })
        .expect(401);

      expect(res.body).toMatchObject({
        status: 401,
        message: 'Credenciais inválidas',
      });
    });
  });

  // ─── POST /auth/refresh ────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('200 — refresh token válido retorna novos tokens', async () => {
      mockRefreshUseCase.execute.mockResolvedValue(TOKEN_PAIR);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('400 — body sem refreshToken falha validação', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body.status).toBe(400);
    });

    it('401 — refresh token revogado ou expirado', async () => {
      mockRefreshUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Refresh token inválido ou expirado'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'revoked-token' })
        .expect(401);

      expect(res.body.status).toBe(401);
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('204 — logout realizado sem conteúdo de resposta', async () => {
      mockLogoutUseCase.execute.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(204);

      expect(mockLogoutUseCase.execute).toHaveBeenCalled();
    });
  });
});
