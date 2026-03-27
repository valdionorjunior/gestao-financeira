import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@presentation/controllers/auth.controller';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/auth/login-user.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUserUseCase } from '@application/use-cases/auth/logout-user.use-case';
import { UserRole } from '@domain/entities/user.entity';

const mockRegisterUseCase = { execute: jest.fn() };
const mockLoginUseCase    = { execute: jest.fn(), generateTokenPair: jest.fn() };
const mockRefreshUseCase  = { execute: jest.fn() };
const mockLogoutUseCase   = { execute: jest.fn() };

function makeReq(overrides: Partial<Record<string, any>> = {}) {
  return {
    headers: {
      authorization: 'Bearer test-access-token',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'jest-test',
    },
    ip: '127.0.0.1',
    ...overrides,
  } as any;
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUserUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUserUseCase,    useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshUseCase },
        { provide: LogoutUserUseCase,   useValue: mockLogoutUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register user and return tokens', async () => {
      const user = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: UserRole.TITULAR };
      mockRegisterUseCase.execute.mockResolvedValue(user);
      mockLoginUseCase.generateTokenPair.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

      const result = await controller.register(
        { email: 'a@b.com', password: 'P@ss123', firstName: 'A', lastName: 'B', lgpdConsent: true } as any,
        makeReq(),
      );

      expect(result.accessToken).toBe('at');
      expect(result.refreshToken).toBe('rt');
      expect(result.user.email).toBe('a@b.com');
    });
  });

  describe('POST /auth/login', () => {
    it('should call loginUseCase with credentials', async () => {
      mockLoginUseCase.execute.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt', user: {} });

      const result = await controller.login({ email: 'a@b.com', password: 'P@ss' } as any, makeReq());

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        { email: 'a@b.com', password: 'P@ss' },
        '127.0.0.1',
        'jest-test',
      );
      expect(result.accessToken).toBe('at');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should call refreshUseCase with token', async () => {
      mockRefreshUseCase.execute.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });

      const result = await controller.refresh({ refreshToken: 'old-rt' } as any, makeReq());

      expect(mockRefreshUseCase.execute).toHaveBeenCalledWith('old-rt', '127.0.0.1', 'jest-test');
      expect(result.accessToken).toBe('new-at');
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logoutUseCase with access token, refresh token and userId', async () => {
      mockLogoutUseCase.execute.mockResolvedValue(undefined);

      await controller.logout(
        makeReq(),
        { refreshToken: 'old-rt' },
        { userId: 'user-uuid-1' },
      );

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith(
        'test-access-token',
        'old-rt',
        'user-uuid-1',
      );
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user from @CurrentUser decorator', async () => {
      const currentUser = { userId: 'u1', email: 'a@b.com', role: UserRole.TITULAR };
      const result = await controller.me(currentUser);
      expect(result).toEqual(currentUser);
    });
  });
});
