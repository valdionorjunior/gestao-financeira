import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateTransferUseCase } from '../transaction.use-cases';
import { TRANSACTION_REPOSITORY } from '../../../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../../../domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '../../../../domain/entities/transaction.entity';

describe('CreateTransferUseCase', () => {
  let useCase: CreateTransferUseCase;

  const mockTransactionRepository = { save: jest.fn() };
  const mockAccountRepository = {
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };

  const ownerId = 'user-uuid-1';

  const originAccount = {
    id: 'account-origin',
    userId: ownerId,
    isOwnedBy: (id: string) => id === ownerId,
  };
  const destinationAccount = {
    id: 'account-destination',
    userId: ownerId,
    isOwnedBy: (id: string) => id === ownerId,
  };

  const baseDto = {
    accountId: 'account-origin',
    destinationAccountId: 'account-destination',
    type: TransactionType.TRANSFER,
    amount: 500,
    description: 'Transferência entre contas',
    date: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransferUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: mockTransactionRepository },
        { provide: ACCOUNT_REPOSITORY, useValue: mockAccountRepository },
      ],
    }).compile();

    useCase = module.get<CreateTransferUseCase>(CreateTransferUseCase);
    jest.clearAllMocks();
  });

  it('should create two paired transactions and update balances on both accounts', async () => {
    mockAccountRepository.findById
      .mockResolvedValueOnce(originAccount)
      .mockResolvedValueOnce(destinationAccount);
    mockTransactionRepository.save
      .mockResolvedValueOnce({ id: 'txn-debit', type: TransactionType.TRANSFER, status: TransactionStatus.CONFIRMED })
      .mockResolvedValueOnce({ id: 'txn-credit', type: TransactionType.TRANSFER, status: TransactionStatus.CONFIRMED });
    mockAccountRepository.updateBalance.mockResolvedValue(undefined);

    const result = await useCase.execute(baseDto as any, ownerId);

    expect(result.debit.id).toBe('txn-debit');
    expect(result.credit.id).toBe('txn-credit');
    expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith('account-origin', -500);
    expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith('account-destination', 500);
  });

  it('should throw BadRequestException when origin and destination are the same', async () => {
    const sameDto = { ...baseDto, destinationAccountId: baseDto.accountId };

    await expect(useCase.execute(sameDto as any, ownerId)).rejects.toThrow(BadRequestException);
    expect(mockAccountRepository.findById).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when destinationAccountId is missing', async () => {
    const noDestDto = { ...baseDto, destinationAccountId: undefined };

    await expect(useCase.execute(noDestDto as any, ownerId)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when origin account does not exist', async () => {
    mockAccountRepository.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(destinationAccount);

    await expect(useCase.execute(baseDto as any, ownerId)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when user does not own the origin account', async () => {
    mockAccountRepository.findById
      .mockResolvedValueOnce(originAccount)
      .mockResolvedValueOnce(destinationAccount);

    await expect(useCase.execute(baseDto as any, 'another-user')).rejects.toThrow(ForbiddenException);
  });
});
