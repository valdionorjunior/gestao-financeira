import { ConflictException } from '@nestjs/common';
import { CreateAccountUseCase } from '../create-account.use-case';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../../domain/repositories/account.repository.interface';
import { EncryptionService } from '../../../../infrastructure/services/encryption.service';
import { AccountType } from '../../../../domain/entities/account.entity';

const mockRepo: jest.Mocked<IAccountRepository> = {
  findById: jest.fn(),
  findAllByUserId: jest.fn(),
  findAllByFamilyId: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  updateBalance: jest.fn(),
  existsByNameAndUser: jest.fn(),
};

const mockEncryption = {
  encrypt: jest.fn((value: string) => `enc(${value})`),
  decrypt: jest.fn((value: string) => value),
} as unknown as EncryptionService;

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateAccountUseCase(mockRepo, mockEncryption);
  });

  it('should create an account without encrypted fields', async () => {
    mockRepo.existsByNameAndUser.mockResolvedValue(false);
    mockRepo.save.mockResolvedValue({ id: 'uuid-1', name: 'Carteira', userId: 'user-1' } as any);

    const result = await useCase.execute(
      { name: 'Carteira', type: AccountType.CHECKING, currency: 'BRL' } as any,
      'user-1',
    );

    expect(mockRepo.existsByNameAndUser).toHaveBeenCalledWith('Carteira', 'user-1');
    expect(mockEncryption.encrypt).not.toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'uuid-1');
  });

  it('should encrypt agency and accountNumber when provided', async () => {
    mockRepo.existsByNameAndUser.mockResolvedValue(false);
    mockRepo.save.mockResolvedValue({ id: 'uuid-2' } as any);

    await useCase.execute(
      { name: 'BB Corrente', type: AccountType.CHECKING, agency: '1234', accountNumber: '56789-0' } as any,
      'user-1',
    );

    expect(mockEncryption.encrypt).toHaveBeenCalledWith('1234');
    expect(mockEncryption.encrypt).toHaveBeenCalledWith('56789-0');
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ agency: 'enc(1234)', accountNumber: 'enc(56789-0)' }),
    );
  });

  it('should throw ConflictException when name already exists', async () => {
    mockRepo.existsByNameAndUser.mockResolvedValue(true);

    await expect(
      useCase.execute({ name: 'Duplicada', type: AccountType.CHECKING } as any, 'user-1'),
    ).rejects.toThrow(ConflictException);

    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should apply default values (balance=0, currency=BRL, includeInTotal=true)', async () => {
    mockRepo.existsByNameAndUser.mockResolvedValue(false);
    mockRepo.save.mockResolvedValue({ id: 'uuid-3' } as any);

    await useCase.execute({ name: 'Caixinha', type: AccountType.SAVINGS } as any, 'user-1');

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 0, currency: 'BRL', includeInTotal: true }),
    );
  });
});
