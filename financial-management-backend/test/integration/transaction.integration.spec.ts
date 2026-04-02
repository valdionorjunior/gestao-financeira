/**
 * Transaction Integration Tests
 *
 * Testa a integração real entre use-cases de transações, regras de domínio
 * e atualização de saldo — sem banco de dados real.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateTransactionUseCase,
  CreateTransferUseCase,
  UpdateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
  GetTransactionUseCase,
} from '@application/use-cases/transactions/transaction.use-cases';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCOUNT_ID  = 'acct-uuid-1';
const ACCOUNT_ID2 = 'acct-uuid-2';
const TXN_ID      = 'txn-uuid-1';
const USER_ID     = 'user-uuid-1';
const OTHER_USER  = 'user-uuid-other';

let txnCounter = 0;

function makeAccount(overrides: Record<string, any> = {}) {
  return {
    id: ACCOUNT_ID,
    userId: USER_ID,
    balance: 2000,
    isOwnedBy: (uid: string) => uid === USER_ID,
    ...overrides,
  };
}

function makeTransaction(overrides: Record<string, any> = {}) {
  return {
    id: TXN_ID,
    userId: USER_ID,
    accountId: ACCOUNT_ID,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CONFIRMED,
    amount: 100,
    description: 'Supermercado',
    date: new Date('2024-01-15'),
    isOwnedBy: (uid: string) => uid === USER_ID,
    isTransfer: () => false,
    isIncome: () => false,
    ...overrides,
  };
}

function makeTransactionRepo() {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
}

function makeAccountRepo() {
  return {
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    updateBalance: jest.fn(),
    softDelete: jest.fn(),
    existsByNameAndUser: jest.fn(),
  };
}

// ─── CreateTransactionUseCase integration ─────────────────────────────────────

describe('[Integration] CreateTransactionUseCase', () => {
  let createUseCase: CreateTransactionUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();
    accountRepo = makeAccountRepo();
    txnCounter = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
      ],
    }).compile();

    createUseCase = module.get(CreateTransactionUseCase);
    jest.clearAllMocks();
  });

  it('cria despesa e atualiza saldo negativo na conta', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    txnRepo.save.mockImplementation(async (data: any) => ({ id: `txn-${++txnCounter}`, ...data }));
    accountRepo.updateBalance.mockResolvedValue(undefined);

    const result = await createUseCase.execute(
      {
        type: TransactionType.EXPENSE,
        accountId: ACCOUNT_ID,
        amount: 150,
        description: 'Supermercado',
        date: '2024-01-15',
      },
      USER_ID,
    );

    expect(result.type).toBe(TransactionType.EXPENSE);
    expect(result.amount).toBe(150);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, -150);
  });

  it('cria receita e atualiza saldo positivo na conta', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    txnRepo.save.mockImplementation(async (data: any) => ({ id: 'txn-1', ...data }));
    accountRepo.updateBalance.mockResolvedValue(undefined);

    await createUseCase.execute(
      {
        type: TransactionType.INCOME,
        accountId: ACCOUNT_ID,
        amount: 3000,
        description: 'Salário',
        date: '2024-01-05',
      },
      USER_ID,
    );

    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, 3000);
  });

  it('não atualiza saldo para transação PENDING', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    txnRepo.save.mockImplementation(async (data: any) => ({
      id: 'txn-1',
      ...data,
      status: TransactionStatus.PENDING,
    }));

    await createUseCase.execute(
      {
        type: TransactionType.EXPENSE,
        accountId: ACCOUNT_ID,
        amount: 50,
        description: 'Compra',
        date: '2024-01-10',
        status: TransactionStatus.PENDING,
      },
      USER_ID,
    );

    expect(accountRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('lança NotFoundException para conta inexistente', async () => {
    accountRepo.findById.mockResolvedValue(null);

    await expect(
      createUseCase.execute(
        { type: TransactionType.EXPENSE, accountId: ACCOUNT_ID, amount: 100, description: 'X', date: '2024-01-01' },
        USER_ID,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(txnRepo.save).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException para conta de outro usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    await expect(
      createUseCase.execute(
        { type: TransactionType.EXPENSE, accountId: ACCOUNT_ID, amount: 100, description: 'X', date: '2024-01-01' },
        OTHER_USER,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException ao tentar criar TRANSFER via este use-case', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    await expect(
      createUseCase.execute(
        {
          type: TransactionType.TRANSFER,
          accountId: ACCOUNT_ID,
          amount: 100,
          description: 'X',
          date: '2024-01-01',
        },
        USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── CreateTransferUseCase integration ────────────────────────────────────────

describe('[Integration] CreateTransferUseCase', () => {
  let transferUseCase: CreateTransferUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransferUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
      ],
    }).compile();

    transferUseCase = module.get(CreateTransferUseCase);
    jest.clearAllMocks();
  });

  it('cria par debit+credit e atualiza ambas as contas', async () => {
    accountRepo.findById
      .mockResolvedValueOnce(makeAccount({ id: ACCOUNT_ID }))
      .mockResolvedValueOnce(makeAccount({ id: ACCOUNT_ID2, isOwnedBy: () => true }));

    let saveCount = 0;
    txnRepo.save.mockImplementation(async (data: any) => ({ id: `txn-${++saveCount}`, ...data }));
    accountRepo.updateBalance.mockResolvedValue(undefined);

    const result = await transferUseCase.execute(
      {
        type: TransactionType.TRANSFER,
        accountId: ACCOUNT_ID,
        destinationAccountId: ACCOUNT_ID2,
        amount: 500,
        description: 'Transferência',
        date: '2024-01-20',
      },
      USER_ID,
    );

    expect(result.id).toBeDefined();
    expect(result.type).toBe(TransactionType.TRANSFER);
    expect(txnRepo.save).toHaveBeenCalledTimes(2);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, -500);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID2, 500);
  });

  it('lança BadRequestException quando destinationAccountId está ausente', async () => {
    await expect(
      transferUseCase.execute(
        { type: TransactionType.TRANSFER, accountId: ACCOUNT_ID, amount: 100, description: 'X', date: '2024-01-01' },
        USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando origem e destino são a mesma conta', async () => {
    await expect(
      transferUseCase.execute(
        {
          type: TransactionType.TRANSFER,
          accountId: ACCOUNT_ID,
          destinationAccountId: ACCOUNT_ID,
          amount: 100,
          description: 'X',
          date: '2024-01-01',
        },
        USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('lança NotFoundException quando conta origem não existe', async () => {
    accountRepo.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeAccount({ id: ACCOUNT_ID2 }));

    await expect(
      transferUseCase.execute(
        {
          type: TransactionType.TRANSFER,
          accountId: ACCOUNT_ID,
          destinationAccountId: ACCOUNT_ID2,
          amount: 100,
          description: 'X',
          date: '2024-01-01',
        },
        USER_ID,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── GetTransactionUseCase + DeleteTransactionUseCase integration ─────────────

describe('[Integration] GetTransactionUseCase', () => {
  let getUseCase: GetTransactionUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
      ],
    }).compile();

    getUseCase = module.get(GetTransactionUseCase);
    jest.clearAllMocks();
  });

  it('retorna transação pelo ID', async () => {
    txnRepo.findById.mockResolvedValue(makeTransaction());

    const result = await getUseCase.execute(TXN_ID, USER_ID);

    expect(result.id).toBe(TXN_ID);
    expect(txnRepo.findById).toHaveBeenCalledWith(TXN_ID);
  });

  it('lança NotFoundException para transação inexistente', async () => {
    txnRepo.findById.mockResolvedValue(null);

    await expect(getUseCase.execute(TXN_ID, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para transação de outro usuário', async () => {
    txnRepo.findById.mockResolvedValue(makeTransaction());

    await expect(getUseCase.execute(TXN_ID, OTHER_USER)).rejects.toThrow(ForbiddenException);
  });
});

describe('[Integration] DeleteTransactionUseCase', () => {
  let deleteUseCase: DeleteTransactionUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
      ],
    }).compile();

    deleteUseCase = module.get(DeleteTransactionUseCase);
    jest.clearAllMocks();
  });

  it('exclui transação CONFIRMED e reverte saldo na conta', async () => {
    const confirmedExpense = makeTransaction({
      type: TransactionType.EXPENSE,
      status: TransactionStatus.CONFIRMED,
      amount: 100,
      isIncome: () => false,
    });
    txnRepo.findById.mockResolvedValue(confirmedExpense);
    accountRepo.updateBalance.mockResolvedValue(undefined);
    txnRepo.softDelete.mockResolvedValue(undefined);

    await deleteUseCase.execute(TXN_ID, USER_ID);

    // Reverte saldo: despesa de 100 -> adiciona +100
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, 100);
    expect(txnRepo.softDelete).toHaveBeenCalledWith(TXN_ID);
  });

  it('lança NotFoundException para transação inexistente', async () => {
    txnRepo.findById.mockResolvedValue(null);

    await expect(deleteUseCase.execute(TXN_ID, USER_ID)).rejects.toThrow(NotFoundException);
  });
});

// ─── UpdateTransactionUseCase integration ─────────────────────────────────────

describe('[Integration] UpdateTransactionUseCase', () => {
  let updateUseCase: UpdateTransactionUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
        { provide: ACCOUNT_REPOSITORY,     useValue: accountRepo },
      ],
    }).compile();

    updateUseCase = module.get(UpdateTransactionUseCase);
    jest.clearAllMocks();
  });

  it('atualiza valor de despesa: reverte saldo antigo e aplica novo', async () => {
    const original = makeTransaction({ amount: 100, status: TransactionStatus.CONFIRMED, isIncome: () => false });
    const after    = makeTransaction({ amount: 200, status: TransactionStatus.CONFIRMED, isIncome: () => false });

    txnRepo.findById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(after);
    txnRepo.update.mockResolvedValue(after);
    accountRepo.updateBalance.mockResolvedValue(undefined);

    await updateUseCase.execute(TXN_ID, { amount: 200 } as any, USER_ID);

    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, 100);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, -200);
  });

  it('atualiza valor de receita: reverte saldo antigo e aplica novo', async () => {
    const original = makeTransaction({ amount: 3000, status: TransactionStatus.CONFIRMED, isIncome: () => true, type: TransactionType.INCOME });
    const after    = makeTransaction({ amount: 3500, status: TransactionStatus.CONFIRMED, isIncome: () => true, type: TransactionType.INCOME });

    txnRepo.findById.mockResolvedValueOnce(original).mockResolvedValueOnce(after);
    txnRepo.update.mockResolvedValue(after);
    accountRepo.updateBalance.mockResolvedValue(undefined);

    await updateUseCase.execute(TXN_ID, { amount: 3500 } as any, USER_ID);

    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, -3000);
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, 3500);
  });

  it('não reverte saldo para transação PENDING', async () => {
    const pending = makeTransaction({ amount: 100, status: TransactionStatus.PENDING, isIncome: () => false });
    const after   = makeTransaction({ amount: 150, status: TransactionStatus.PENDING, isIncome: () => false });

    txnRepo.findById.mockResolvedValueOnce(pending).mockResolvedValueOnce(after);
    txnRepo.update.mockResolvedValue(after);

    await updateUseCase.execute(TXN_ID, { amount: 150 } as any, USER_ID);

    expect(accountRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('lança BadRequestException ao tentar editar transferência', async () => {
    const transfer = makeTransaction({ type: TransactionType.TRANSFER, isTransfer: () => true });
    txnRepo.findById.mockResolvedValue(transfer);

    await expect(updateUseCase.execute(TXN_ID, {} as any, USER_ID)).rejects.toThrow(BadRequestException);
  });

  it('lança ForbiddenException para transação de outro usuário', async () => {
    txnRepo.findById.mockResolvedValue(makeTransaction({ isOwnedBy: () => false }));

    await expect(updateUseCase.execute(TXN_ID, {} as any, USER_ID)).rejects.toThrow(ForbiddenException);
  });
});

// ─── ListTransactionsUseCase integration ──────────────────────────────────────

describe('[Integration] ListTransactionsUseCase', () => {
  let listUseCase: ListTransactionsUseCase;
  let txnRepo: ReturnType<typeof makeTransactionRepo>;

  beforeEach(async () => {
    txnRepo = makeTransactionRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListTransactionsUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txnRepo },
      ],
    }).compile();

    listUseCase = module.get(ListTransactionsUseCase);
    jest.clearAllMocks();
  });

  it('lista transações aplicando filtros ao repositório', async () => {
    txnRepo.findAll.mockResolvedValue({ data: [makeTransaction()], total: 1, page: 1, limit: 20 });

    const result = await listUseCase.execute(
      { accountId: ACCOUNT_ID, startDate: '2024-01-01', endDate: '2024-01-31' } as any,
      USER_ID,
    );

    expect(txnRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
      userId:    USER_ID,
      accountId: ACCOUNT_ID,
      startDate: new Date('2024-01-01'),
      endDate:   new Date('2024-01-31'),
      page: 1,
      limit: 20,
    }));
    expect(result.total).toBe(1);
  });

  it('usa paginação padrão quando não fornecida', async () => {
    txnRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    await listUseCase.execute({} as any, USER_ID);

    expect(txnRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
      userId: USER_ID,
      page: 1,
      limit: 20,
    }));
  });
});
