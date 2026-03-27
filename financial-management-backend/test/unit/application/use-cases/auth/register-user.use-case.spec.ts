import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { USER_REPOSITORY } from '@domain/repositories/user.repository.interface';
import { UserRole, UserStatus } from '@domain/entities/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  const mockUserRepository = {
    existsByEmail: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();
    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    mockUserRepository.existsByEmail.mockResolvedValue(false);
    mockUserRepository.save.mockResolvedValue({
      id: 'uuid-1',
      email: 'joao@email.com',
      firstName: 'João',
      lastName: 'Silva',
      role: UserRole.TITULAR,
      status: UserStatus.ACTIVE,
    });

    const result = await useCase.execute({
      email: 'joao@email.com',
      password: 'Senha@123',
      firstName: 'João',
      lastName: 'Silva',
      lgpdConsent: true,
    });

    expect(result.email).toBe('joao@email.com');
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    const savedData = mockUserRepository.save.mock.calls[0][0];
    expect(savedData.passwordHash).not.toBe('Senha@123');
    expect(savedData.lgpdConsent).toBe(true);
  });

  it('should throw BadRequestException when lgpdConsent is false', async () => {
    await expect(
      useCase.execute({
        email: 'joao@email.com',
        password: 'Senha@123',
        firstName: 'João',
        lastName: 'Silva',
        lgpdConsent: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException when email already exists', async () => {
    mockUserRepository.existsByEmail.mockResolvedValue(true);
    await expect(
      useCase.execute({
        email: 'joao@email.com',
        password: 'Senha@123',
        firstName: 'João',
        lastName: 'Silva',
        lgpdConsent: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should hash the password (not store plain text)', async () => {
    mockUserRepository.existsByEmail.mockResolvedValue(false);
    mockUserRepository.save.mockResolvedValue({
      id: '1',
      email: 'x@x.com',
      firstName: 'A',
      lastName: 'B',
      role: UserRole.TITULAR,
    });

    await useCase.execute({
      email: 'x@x.com',
      password: 'Senha@123',
      firstName: 'A',
      lastName: 'B',
      lgpdConsent: true,
    });

    const savedData = mockUserRepository.save.mock.calls[0][0];
    expect(savedData.passwordHash).not.toBe('Senha@123');
    expect(savedData.passwordHash.startsWith('$2b$')).toBe(true);
  });
});
