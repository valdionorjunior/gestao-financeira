import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserUseCase } from '../login-user.use-case';
import { USER_REPOSITORY } from '../../../../domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../../../../domain/repositories/refresh-token.repository.interface';
import { UserRole, UserStatus } from '../../../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    update: jest.fn(),
  };
  const mockRefreshTokenRepository = {
    create: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  };

  const hashedPassword = bcrypt.hashSync('Senha@123', 10);

  const activeUser = {
    id: 'user-uuid-1',
    email: 'joao@email.com',
    firstName: 'João',
    lastName: 'Silva',
    role: UserRole.TITULAR,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    passwordHash: hashedPassword,
    isActive: () => true,
    canLogin: () => true,
  };

  const inactiveUser = {
    ...activeUser,
    status: UserStatus.SUSPENDED,
    isActive: () => false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('signed-token');
    mockConfigService.get.mockReturnValue('secret');
  });

  it('should return access and refresh tokens on successful login', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ ...activeUser, passwordHash: hashedPassword });
    mockUserRepository.update.mockResolvedValue(undefined);
    mockRefreshTokenRepository.create.mockResolvedValue(undefined);

    const result = await useCase.execute(
      { email: 'joao@email.com', password: 'Senha@123' },
      '127.0.0.1',
      'Jest/Test',
    );

    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
    expect(result.user.email).toBe('joao@email.com');
    expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'ghost@email.com', password: 'anypass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ ...activeUser, passwordHash: hashedPassword });

    await expect(
      useCase.execute({ email: 'joao@email.com', password: 'WrongPass!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when user account is not active', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ ...inactiveUser, passwordHash: hashedPassword });

    await expect(
      useCase.execute({ email: 'joao@email.com', password: 'Senha@123' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
