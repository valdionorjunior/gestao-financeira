import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateTransactionUseCase } from '../transaction.use-cases';
import { TRANSACTION_REPOSITORY } from '../../../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../../../domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '../../../../domain/entities/transaction.entity';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;

  const mockTransactionRepository = { save: jest.fn() };
  const mockAccountRepository = {
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };

  const ownerId = 'user-uuid-1';

  const mockAccount = {
    id: 'account-uuid-1',
    userId: ownerId,
    balance: 1000,
    isOwnedBy: (userId: string) => userId === ownerId,
  };

  const baseDto = {
    accountId: 'account-uuid-1',
    type: TransactionType.EXPENSE,
    amount: 150,
    description: 'Supermercado',
    date: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: ACCOUNT_REPOSITORY, useValue: mockAccountRepository },
      ],
    }).compile();

    useCase = module.get<CreateTransactionUseCase>(CreateTransactionUseCase);
    jest.clearAllMocks();
  });

  it('should create an expense and debit the account balance', async () => {
    mockAccountRepository.findById.mockResolvedValue(mockAccount);
    mockTransactionRepository.save.mockResolvedValue({
      id: 'txn-uuid-1',
      ...baseDto,
      status: TransactionStatus.CONFIRMED,
    });
    mockAccountRepository.updateBalance.mockResolvedValue(undefined);

    const result = await useCase.execute(baseDto as any, ownerId);

    expect(result.id).toBe('txn-uuid-1');
    expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith('account-uuid-1', -150);
  });

  it('should create an income and credit the account balance', async () => {
    const incomeDto = { ...baseDto, type: TransactionType.INCOME, amount: 3000 };
    mockAccountRepository.findById.mockResolvedValue(mockAccount);
    mockTransactionRepository.save.mockResolvedValue({
      id: 'txn-uuid-2',
      ...incomeDto,
      status: TransactionStatus.CONFIRMED,
    });
    mockAccountRepository.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(incomeDto as any, ownerId);

    expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith('account-uuid-1', 3000);
  });

  it('should NOT update balance when status is PENDING', async () => {
    const pendingDto = { ...baseDto, status: TransactionStatus.PENDING };
    mockAccountRepository.findById.mockResolvedValue(mockAccount);
    mockTransactionRepository.save.mockResolvedValue({
      id: 'txn-uuid-3',
      ...pendingDto,
    });
    mockAccountRepository.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(pendingDto as any, ownerId);

    expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when account does not exist', async () => {
    mockAccountRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseDto as any, ownerId)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the account', async () => {
    mockAccountRepository.findById.mockResolvedValue(mockAccount);

    await expect(useCase.execute(baseDto as any, 'other-user-id')).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException when type is TRANSFER', async () => {
    const transferDto = { ...baseDto, type: TransactionType.TRANSFER };
    mockAccountRepository.findById.mockResolvedValue(mockAccount);

    await expect(useCase.execute(transferDto as any, ownerId)).rejects.toThrow(BadRequestException);
  });
});
