/**
 * Auth Integration Tests
 *
 * Testa a integração real entre os use-cases de autenticação, serviços de
 * infraestrutura e a camada de domínio — sem banco de dados real.
 * Repositórios são substituídos por mocks; bcrypt e JwtService operam de verdade.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { USER_REPOSITORY } from '@domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '@domain/repositories/refresh-token.repository.interface';
import { TokenBlacklistService } from '@infrastructure/services/token-blacklist.service';
import { UserRole, UserStatus } from '@domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

// JWT config values usados nos testes
const JWT_CONFIG: Record<string, string> = {
  'jwt.accessSecret': 'test-access-secret-32chars-minimum!',
  'jwt.refreshSecret': 'test-refresh-secret-32chars-mini!',
  'jwt.accessExpiresIn': '15m',
  'jwt.refreshExpiresIn': '7d',
};
const mockConfigService = { get: jest.fn((key: string) => JWT_CONFIG[key]) };

// ─── Deep Mocks ──────────────────────────────────────────────────────────────

function makeUserRepository() {
  return {
    findByEmail: jest.fn(),
    existsByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    softDelete: jest.fn(),
  };
}

function makeRefreshTokenRepository() {
  return {
    create: jest.fn(),
    findByToken: jest.fn(),
    revokeByToken: jest.fn(),
    revokeAllByUserId: jest.fn(),
    save: jest.fn(),
  };
}

function makeTokenBlacklistService() {
  return {
    blacklist: jest.fn().mockResolvedValue(undefined),
    isBlacklisted: jest.fn().mockResolvedValue(false),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };
}

// ─── RegisterUserUseCase integration ─────────────────────────────────────────

describe('[Integration] RegisterUserUseCase', () => {
  let registerUseCase: RegisterUserUseCase;
  let userRepo: ReturnType<typeof makeUserRepository>;

  beforeEach(async () => {
    userRepo = makeUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    registerUseCase = module.get(RegisterUserUseCase);
    jest.clearAllMocks();
  });

  it('registra usuário com senha hasheada via bcrypt', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockImplementation(async (data: any) => ({
      id: 'new-uuid',
      ...data,
      createdAt: new Date(),
    }));

    const result = await registerUseCase.execute({
      email: 'joao@example.com',
      password: 'Senha@123',
      firstName: 'João',
      lastName: 'Silva',
      lgpdConsent: true,
    });

    expect(result.email).toBe('joao@example.com');
    expect(result.role).toBe(UserRole.TITULAR);

    // Verifica que o save foi chamado com hash bcrypt (não senha em texto plano)
    const saveArg = userRepo.save.mock.calls[0][0];
    expect(saveArg.passwordHash).toBeDefined();
    expect(saveArg.passwordHash).not.toBe('Senha@123');
    const hashValid = await bcrypt.compare('Senha@123', saveArg.passwordHash);
    expect(hashValid).toBe(true);
  });

  it('normaliza e-mail para minúsculas', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockImplementation(async (data: any) => ({ id: 'u1', ...data }));

    await registerUseCase.execute({
      email: 'JOAO@EXAMPLE.COM',
      password: 'Senha@123',
      firstName: 'João',
      lastName: 'Silva',
      lgpdConsent: true,
    });

    expect(userRepo.save.mock.calls[0][0].email).toBe('joao@example.com');
  });

  it('lança ConflictException quando e-mail já está cadastrado', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    await expect(
      registerUseCase.execute({
        email: 'existente@example.com',
        password: 'Senha@123',
        firstName: 'A',
        lastName: 'B',
        lgpdConsent: true,
      }),
    ).rejects.toThrow(ConflictException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('lança BadRequestException quando lgpdConsent é false', async () => {
    await expect(
      registerUseCase.execute({
        email: 'joao@example.com',
        password: 'Senha@123',
        firstName: 'A',
        lastName: 'B',
        lgpdConsent: false,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(userRepo.existsByEmail).not.toHaveBeenCalled();
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('grava lgpdConsent=true e lgpdConsentAt', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockImplementation(async (data: any) => ({ id: 'u1', ...data }));

    await registerUseCase.execute({
      email: 'joao@example.com',
      password: 'Senha@123',
      firstName: 'João',
      lastName: 'Silva',
      lgpdConsent: true,
    });

    const saved = userRepo.save.mock.calls[0][0];
    expect(saved.lgpdConsent).toBe(true);
    expect(saved.lgpdConsentAt).toBeInstanceOf(Date);
  });
});

// ─── LoginUserUseCase integration ─────────────────────────────────────────────

describe('[Integration] LoginUserUseCase', () => {
  let loginUseCase: LoginUserUseCase;
  let userRepo: ReturnType<typeof makeUserRepository>;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepository>;

  const HASHED_PASSWORD = bcrypt.hashSync('Senha@123', 10);

  const activeUser = {
    id: 'user-uuid-1',
    email: 'joao@example.com',
    passwordHash: HASHED_PASSWORD,
    role: UserRole.TITULAR,
    status: UserStatus.ACTIVE,
    firstName: 'João',
    lastName: 'Silva',
    isActive: () => true,
  };

  beforeEach(async () => {
    userRepo = makeUserRepository();
    refreshTokenRepo = makeRefreshTokenRepository();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-access-secret-32chars-minimum!', signOptions: { expiresIn: '15m' } }),
      ],
      providers: [
        LoginUserUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    loginUseCase = module.get(LoginUserUseCase);
    jest.clearAllMocks();

    refreshTokenRepo.create.mockResolvedValue({ id: 'rt-1', token: 'mock-rt', userId: activeUser.id });
  });

  it('retorna accessToken, refreshToken e dados do usuário em login válido', async () => {
    userRepo.findByEmail.mockResolvedValue(activeUser);
    userRepo.update.mockResolvedValue(undefined);
    refreshTokenRepo.save?.mockResolvedValue({ id: 'rt-1' });
    refreshTokenRepo.create.mockResolvedValue({ id: 'rt-1' });

    const result = await loginUseCase.execute(
      { email: 'joao@example.com', password: 'Senha@123' },
      '127.0.0.1',
      'Jest',
    );

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('joao@example.com');
    expect(result.user.role).toBe(UserRole.TITULAR);
  });

  it('lança UnauthorizedException para senha errada', async () => {
    userRepo.findByEmail.mockResolvedValue(activeUser);

    await expect(
      loginUseCase.execute({ email: 'joao@example.com', password: 'SenhaErrada@1' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando usuário não existe', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({ email: 'naoexiste@example.com', password: 'Senha@123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lança exceção quando conta está inativa', async () => {
    userRepo.findByEmail.mockResolvedValue({
      ...activeUser,
      isActive: () => false,
    });

    await expect(
      loginUseCase.execute({ email: 'joao@example.com', password: 'Senha@123' }),
    ).rejects.toThrow();
  });

  it('atualiza lastLoginAt após login bem-sucedido', async () => {
    userRepo.findByEmail.mockResolvedValue(activeUser);
    userRepo.update.mockResolvedValue(undefined);
    refreshTokenRepo.create.mockResolvedValue({ id: 'rt-1' });

    await loginUseCase.execute({ email: 'joao@example.com', password: 'Senha@123' });

    expect(userRepo.update).toHaveBeenCalledWith(
      activeUser.id,
      expect.objectContaining({ lastLoginAt: expect.any(Date) }),
    );
  });
});

// ─── LogoutUserUseCase integration ───────────────────────────────────────────

describe('[Integration] LogoutUserUseCase', () => {
  let logoutUseCase: LogoutUserUseCase;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepository>;
  let tokenBlacklist: ReturnType<typeof makeTokenBlacklistService>;

  beforeEach(async () => {
    refreshTokenRepo = makeRefreshTokenRepository();
    tokenBlacklist = makeTokenBlacklistService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUserUseCase,
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: TokenBlacklistService, useValue: tokenBlacklist },
      ],
    }).compile();

    logoutUseCase = module.get(LogoutUserUseCase);
    jest.clearAllMocks();
  });

  it('coloca accessToken na blacklist e revoga refreshToken específico', async () => {
    tokenBlacklist.blacklist.mockResolvedValue(undefined);
    refreshTokenRepo.revokeByToken.mockResolvedValue(undefined);

    await logoutUseCase.execute('access-token', 'refresh-token');

    expect(tokenBlacklist.blacklist).toHaveBeenCalledWith('access-token');
    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith('refresh-token');
  });

  it('revoga todos os tokens do usuário quando refreshToken não é fornecido', async () => {
    tokenBlacklist.blacklist.mockResolvedValue(undefined);
    refreshTokenRepo.revokeAllByUserId.mockResolvedValue(undefined);

    await logoutUseCase.execute('access-token', undefined, 'user-uuid-1');

    expect(refreshTokenRepo.revokeAllByUserId).toHaveBeenCalledWith('user-uuid-1');
    expect(refreshTokenRepo.revokeByToken).not.toHaveBeenCalled();
  });
});

// ─── Register → Login flow ───────────────────────────────────────────────────

describe('[Integration] Fluxo Registro → Login', () => {
  let registerUseCase: RegisterUserUseCase;
  let loginUseCase: LoginUserUseCase;
  let userRepo: ReturnType<typeof makeUserRepository>;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepository>;

  beforeEach(async () => {
    userRepo = makeUserRepository();
    refreshTokenRepo = makeRefreshTokenRepository();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: 'test-access-secret-32chars-minimum!', signOptions: { expiresIn: '15m' } }),
      ],
      providers: [
        RegisterUserUseCase,
        LoginUserUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    registerUseCase = module.get(RegisterUserUseCase);
    loginUseCase = module.get(LoginUserUseCase);

    refreshTokenRepo.create.mockResolvedValue({ id: 'rt-1' });
  });

  it('usuário registrado consegue fazer login com as mesmas credenciais', async () => {
    // Simula DB em memória
    let storedUser: any = null;

    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockImplementation(async (data: any) => {
      storedUser = { id: 'user-new', ...data, isActive: () => true };
      return storedUser;
    });
    userRepo.findByEmail.mockImplementation(async () => storedUser);
    userRepo.update.mockResolvedValue(undefined);

    // Registrar
    const registered = await registerUseCase.execute({
      email: 'novo@example.com',
      password: 'Senha@123',
      firstName: 'Novo',
      lastName: 'User',
      lgpdConsent: true,
    });

    expect(registered.email).toBe('novo@example.com');

    // Login com as mesmas credenciais
    const logged = await loginUseCase.execute({
      email: 'novo@example.com',
      password: 'Senha@123',
    });

    expect(logged.accessToken).toBeDefined();
    expect(logged.user.email).toBe('novo@example.com');
  });
});

// ─── RefreshTokenUseCase integration ─────────────────────────────────────────

describe('[Integration] RefreshTokenUseCase', () => {
  let loginUseCase: LoginUserUseCase;
  let refreshUseCase: RefreshTokenUseCase;
  let userRepo: ReturnType<typeof makeUserRepository>;
  let refreshTokenRepo: ReturnType<typeof makeRefreshTokenRepository>;
  let jwtService: JwtService;

  const storedUser = {
    id: 'user-1',
    email: 'refresh@example.com',
    role: UserRole.TITULAR,
    isActive: () => true,
  };

  beforeEach(async () => {
    userRepo = makeUserRepository();
    refreshTokenRepo = makeRefreshTokenRepository();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({}),
      ],
      providers: [
        LoginUserUseCase,
        RefreshTokenUseCase,
        { provide: USER_REPOSITORY,          useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: ConfigService,            useValue: mockConfigService },
        { provide: TokenBlacklistService,    useValue: makeTokenBlacklistService() },
      ],
    }).compile();

    loginUseCase   = module.get(LoginUserUseCase);
    refreshUseCase = module.get(RefreshTokenUseCase);
    jwtService     = module.get(JwtService);
    jest.clearAllMocks();
  });

  it('emite novo par de tokens ao receber refresh token válido', async () => {
    // Gera refresh token real assinado
    const refreshToken = jwtService.sign(
      { sub: storedUser.id },
      { secret: JWT_CONFIG['jwt.refreshSecret'], expiresIn: '7d' },
    );

    const storedRefreshToken = {
      id: 'rt-1',
      token: refreshToken,
      userId: storedUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    userRepo.findById.mockResolvedValue(storedUser);
    refreshTokenRepo.findByToken.mockResolvedValue(storedRefreshToken);
    refreshTokenRepo.revokeByToken.mockResolvedValue(undefined);
    refreshTokenRepo.create.mockResolvedValue({ token: 'new-refresh-token' });

    const tokens = await refreshUseCase.execute(refreshToken);

    expect(refreshTokenRepo.revokeByToken).toHaveBeenCalledWith(refreshToken);
    expect(tokens.accessToken).toBeDefined();
  });

  it('lança UnauthorizedException para refresh token inválido (assinatura errada)', async () => {
    const badToken = 'invalid.token.signature';

    await expect(refreshUseCase.execute(badToken)).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException para token revogado (reuse attack)', async () => {
    const refreshToken = jwtService.sign(
      { sub: storedUser.id },
      { secret: JWT_CONFIG['jwt.refreshSecret'], expiresIn: '7d' },
    );

    const revokedToken = {
      id: 'rt-2',
      token: refreshToken,
      userId: storedUser.id,
      isRevoked: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    refreshTokenRepo.findByToken.mockResolvedValue(revokedToken);
    refreshTokenRepo.revokeAllByUserId.mockResolvedValue(undefined);

    await expect(refreshUseCase.execute(refreshToken)).rejects.toThrow(UnauthorizedException);
    expect(refreshTokenRepo.revokeAllByUserId).toHaveBeenCalledWith(storedUser.id);
  });

  it('lança UnauthorizedException para token não encontrado no banco', async () => {
    const refreshToken = jwtService.sign(
      { sub: storedUser.id },
      { secret: JWT_CONFIG['jwt.refreshSecret'], expiresIn: '7d' },
    );

    refreshTokenRepo.findByToken.mockResolvedValue(null);

    await expect(refreshUseCase.execute(refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException para token expirado', async () => {
    const refreshToken = jwtService.sign(
      { sub: storedUser.id },
      { secret: JWT_CONFIG['jwt.refreshSecret'], expiresIn: '7d' },
    );

    const expiredToken = {
      id: 'rt-3',
      token: refreshToken,
      userId: storedUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() - 1000), // já expirou
    };

    refreshTokenRepo.findByToken.mockResolvedValue(expiredToken);
    refreshTokenRepo.revokeByToken.mockResolvedValue(undefined);

    await expect(refreshUseCase.execute(refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException para usuário inativo', async () => {
    const refreshToken = jwtService.sign(
      { sub: storedUser.id },
      { secret: JWT_CONFIG['jwt.refreshSecret'], expiresIn: '7d' },
    );

    const validToken = {
      id: 'rt-4',
      token: refreshToken,
      userId: storedUser.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    refreshTokenRepo.findByToken.mockResolvedValue(validToken);
    userRepo.findById.mockResolvedValue({ ...storedUser, isActive: () => false });

    await expect(refreshUseCase.execute(refreshToken)).rejects.toThrow(UnauthorizedException);
  });
});
