import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { REFRESH_TOKEN_REPOSITORY } from '@domain/repositories/refresh-token.repository.interface';
import { USER_REPOSITORY } from '@domain/repositories/user.repository.interface';
import { TokenBlacklistService } from '@infrastructure/services/token-blacklist.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@domain/entities/user.entity';

// ─── LogoutUserUseCase ────────────────────────────────────────────────────────

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;

  const mockRefreshTokenRepository = {
    revokeByToken: jest.fn(),
    revokeAllByUserId: jest.fn(),
  };
  const mockTokenBlacklistService = {
    blacklist: jest.fn(),
    isBlacklisted: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUserUseCase,
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepository },
        { provide: TokenBlacklistService, useValue: mockTokenBlacklistService },
      ],
    }).compile();

    useCase = module.get<LogoutUserUseCase>(LogoutUserUseCase);
    jest.clearAllMocks();
  });

  it('should blacklist access token and revoke specific refresh token', async () => {
    mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);
    mockRefreshTokenRepository.revokeByToken.mockResolvedValue(undefined);

    await useCase.execute('access-token-xyz', 'refresh-token-abc');

    expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith('access-token-xyz');
    expect(mockRefreshTokenRepository.revokeByToken).toHaveBeenCalledWith('refresh-token-abc');
    expect(mockRefreshTokenRepository.revokeAllByUserId).not.toHaveBeenCalled();
  });

  it('should revoke all refresh tokens for user when refreshToken is not provided', async () => {
    mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await useCase.execute('access-token-xyz', undefined, 'user-uuid-1');

    expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith('access-token-xyz');
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('user-uuid-1');
    expect(mockRefreshTokenRepository.revokeByToken).not.toHaveBeenCalled();
  });

  it('should only blacklist access token when no refresh token or userId provided', async () => {
    mockTokenBlacklistService.blacklist.mockResolvedValue(undefined);

    await useCase.execute('access-token-xyz');

    expect(mockTokenBlacklistService.blacklist).toHaveBeenCalledWith('access-token-xyz');
    expect(mockRefreshTokenRepository.revokeByToken).not.toHaveBeenCalled();
    expect(mockRefreshTokenRepository.revokeAllByUserId).not.toHaveBeenCalled();
  });
});

// ─── RefreshTokenUseCase ──────────────────────────────────────────────────────

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;

  const mockUserRepository = {
    findById: jest.fn(),
  };
  const mockRefreshTokenRepository = {
    findByToken: jest.fn(),
    revokeByToken: jest.fn(),
    revokeAllByUserId: jest.fn(),
    create: jest.fn(),
  };
  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn().mockReturnValue('new-signed-token'),
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('refresh-secret'),
  };
  const mockLoginUserUseCase = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
  };

  const activeUser = {
    id: 'user-uuid-1',
    email: 'joao@example.com',
    role: UserRole.TITULAR,
    status: UserStatus.ACTIVE,
    isActive: () => true,
  };

  const validStoredToken = {
    id: 'stored-1',
    token: 'valid-refresh-token',
    userId: 'user-uuid-1',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86400000), // 1 day in future
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoginUserUseCase, useValue: mockLoginUserUseCase },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('new-signed-token');
    mockConfigService.get.mockReturnValue('refresh-secret');
  });

  it('should throw UnauthorizedException when JWT verification fails', async () => {
    mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

    await expect(useCase.execute('invalid-token')).rejects.toThrow(UnauthorizedException);
    await expect(useCase.execute('invalid-token')).rejects.toThrow('Refresh token inválido ou expirado');
  });

  it('should throw UnauthorizedException when stored token not found', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
    mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

    await expect(useCase.execute('orphan-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException and revoke all tokens on token reuse (revoked)', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
    mockRefreshTokenRepository.findByToken.mockResolvedValue({ ...validStoredToken, isRevoked: true });
    mockRefreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined);

    await expect(useCase.execute('reused-token')).rejects.toThrow(UnauthorizedException);
    expect(mockRefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('user-uuid-1');
  });

  it('should throw UnauthorizedException when token is expired', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
    mockRefreshTokenRepository.findByToken.mockResolvedValue({
      ...validStoredToken,
      expiresAt: new Date(Date.now() - 1000), // expired
    });
    mockRefreshTokenRepository.revokeByToken.mockResolvedValue(undefined);

    await expect(useCase.execute('expired-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is inactive', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
    mockRefreshTokenRepository.findByToken.mockResolvedValue(validStoredToken);
    mockUserRepository.findById.mockResolvedValue({ ...activeUser, isActive: () => false });
    mockRefreshTokenRepository.revokeByToken.mockResolvedValue(undefined);
    mockLoginUserUseCase.generateTokenPair.mockResolvedValue(undefined);

    await expect(useCase.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });
});
