import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { GetAccountUseCase, DeleteAccountUseCase } from '@application/use-cases/accounts/get-account.use-case';
import { UpdateAccountUseCase } from '@application/use-cases/accounts/update-account.use-case';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { EncryptionService } from '@infrastructure/services/encryption.service';

const makeAccount = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'acc-uuid-1',
  userId: 'user-1',
  name: 'Conta Corrente',
  agency: 'enc(1234)',
  accountNumber: 'enc(56789-0)',
  isOwnedBy: (id: string) => id === 'user-1',
  ...overrides,
});

const mockRepo = {
  findById: jest.fn(),
  findAllByUserId: jest.fn(),
  existsByNameAndUser: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockEncryption = {
  encrypt: jest.fn((v: string) => `enc(${v})`),
  decrypt: jest.fn((v: string) => v.replace('enc(', '').replace(')', '')),
} as unknown as EncryptionService;

beforeEach(() => jest.clearAllMocks());

// ─── GetAccountUseCase ────────────────────────────────────────────────────────

describe('GetAccountUseCase', () => {
  let useCase: GetAccountUseCase;

  beforeEach(() => {
    useCase = new GetAccountUseCase(mockRepo as any, mockEncryption);
  });

  it('should return all accounts for a user with decrypted fields', async () => {
    mockRepo.findAllByUserId.mockResolvedValue([makeAccount(), makeAccount({ id: 'acc-uuid-2', agency: undefined, accountNumber: undefined })]);

    const result = await useCase.findAll('user-1');

    expect(result).toHaveLength(2);
    expect(mockEncryption.decrypt).toHaveBeenCalledWith('enc(1234)');
  });

  it('should find one account and decrypt sensitive fields', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());

    const result = await useCase.findOne('acc-uuid-1', 'user-1');

    expect(result.id).toBe('acc-uuid-1');
    expect(mockEncryption.decrypt).toHaveBeenCalledWith('enc(1234)');
    expect(mockEncryption.decrypt).toHaveBeenCalledWith('enc(56789-0)');
  });

  it('should throw NotFoundException when account does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.findOne('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the account', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());

    await expect(useCase.findOne('acc-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── DeleteAccountUseCase ─────────────────────────────────────────────────────

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;

  beforeEach(() => {
    useCase = new DeleteAccountUseCase(mockRepo as any);
  });

  it('should soft-delete an owned account', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());
    mockRepo.softDelete.mockResolvedValue(undefined);

    await useCase.execute('acc-uuid-1', 'user-1');

    expect(mockRepo.softDelete).toHaveBeenCalledWith('acc-uuid-1');
  });

  it('should throw NotFoundException when account does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the account', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());

    await expect(useCase.execute('acc-uuid-1', 'outsider')).rejects.toThrow(ForbiddenException);
  });
});

// ─── UpdateAccountUseCase ─────────────────────────────────────────────────────

describe('UpdateAccountUseCase', () => {
  let useCase: UpdateAccountUseCase;

  beforeEach(() => {
    useCase = new UpdateAccountUseCase(mockRepo as any, mockEncryption);
  });

  it('should update an account successfully', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());
    mockRepo.existsByNameAndUser.mockResolvedValue(false);
    mockRepo.update.mockResolvedValue({ ...makeAccount(), name: 'Conta Nova' });

    const result = await useCase.execute('acc-uuid-1', { name: 'Conta Nova' } as any, 'user-1');

    expect(mockRepo.update).toHaveBeenCalledWith('acc-uuid-1', expect.objectContaining({ name: 'Conta Nova' }));
    expect(result.name).toBe('Conta Nova');
  });

  it('should encrypt agency and accountNumber when provided in update', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());
    mockRepo.existsByNameAndUser.mockResolvedValue(false);
    mockRepo.update.mockResolvedValue({ ...makeAccount() });

    await useCase.execute('acc-uuid-1', { agency: '9999', accountNumber: '11111-2' } as any, 'user-1');

    expect(mockEncryption.encrypt).toHaveBeenCalledWith('9999');
    expect(mockEncryption.encrypt).toHaveBeenCalledWith('11111-2');
    expect(mockRepo.update).toHaveBeenCalledWith(
      'acc-uuid-1',
      expect.objectContaining({ agency: 'enc(9999)', accountNumber: 'enc(11111-2)' }),
    );
  });

  it('should throw NotFoundException when account does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent', { name: 'X' } as any, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the account', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());

    await expect(useCase.execute('acc-uuid-1', { name: 'X' } as any, 'outsider')).rejects.toThrow(ForbiddenException);
  });

  it('should throw ConflictException when new name already exists', async () => {
    mockRepo.findById.mockResolvedValue(makeAccount());
    mockRepo.existsByNameAndUser.mockResolvedValue(true);

    await expect(
      useCase.execute('acc-uuid-1', { name: 'Outro Nome Existente' } as any, 'user-1'),
    ).rejects.toThrow(ConflictException);
  });
});
