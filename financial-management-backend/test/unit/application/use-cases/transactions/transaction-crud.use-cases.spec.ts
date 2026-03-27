import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  UpdateTransactionUseCase,
  DeleteTransactionUseCase,
  ListTransactionsUseCase,
  GetTransactionUseCase,
} from '@application/use-cases/transactions/transaction.use-cases';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '@domain/entities/transaction.entity';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const OWNER_ID  = 'user-uuid-1';
const OTHER_ID  = 'user-uuid-9';
const ACCT_ID   = 'acct-uuid-1';
const ACCT_B_ID = 'acct-uuid-2';
const TXN_ID    = 'txn-uuid-1';
const PAIR_ID   = 'pair-uuid-1';

function makeTxRepo() {
  return {
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    softDelete: jest.fn(),
    findByTransferPairId: jest.fn(),
  };
}

function makeAcctRepo() {
  return {
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };
}

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: TXN_ID,
    userId: OWNER_ID,
    accountId: ACCT_ID,
    amount: 150,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.CONFIRMED,
    isOwnedBy: (id: string) => id === OWNER_ID,
    isIncome: () => false,
    isTransfer: () => false,
    transferPairId: null,
    ...overrides,
  };
}

function makeIncome(overrides: Record<string, unknown> = {}) {
  return {
    ...makeExpense({ type: TransactionType.INCOME, isIncome: () => true }),
    ...overrides,
  };
}

function makeTransfer(overrides: Record<string, unknown> = {}) {
  return {
    ...makeExpense({
      type: TransactionType.TRANSFER,
      isTransfer: () => true,
      transferPairId: PAIR_ID,
    }),
    ...overrides,
  };
}

// ─── UpdateTransactionUseCase ─────────────────────────────────────────────────

describe('UpdateTransactionUseCase', () => {
  let useCase: UpdateTransactionUseCase;
  let txRepo: ReturnType<typeof makeTxRepo>;
  let acctRepo: ReturnType<typeof makeAcctRepo>;

  beforeEach(async () => {
    txRepo   = makeTxRepo();
    acctRepo = makeAcctRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
        { provide: ACCOUNT_REPOSITORY,     useValue: acctRepo },
      ],
    }).compile();

    useCase = module.get(UpdateTransactionUseCase);
    jest.clearAllMocks();
  });

  it('atualiza despesa e reverte + aplica saldo', async () => {
    const original = makeExpense({ amount: 150 });
    const updated  = makeExpense({ amount: 200 });
    txRepo.findById.mockResolvedValueOnce(original).mockResolvedValueOnce(updated);
    txRepo.update.mockResolvedValue(updated);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    const result = await useCase.execute(TXN_ID, { amount: 200 } as any, OWNER_ID);

    // revert old debit: +150; apply new debit: -200
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, 150);
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, -200);
    expect(result).toBe(updated);
  });

  it('atualiza receita e reverte + aplica saldo', async () => {
    const original = makeIncome({ amount: 3000 });
    const updated  = makeIncome({ amount: 3500 });
    txRepo.findById.mockResolvedValueOnce(original).mockResolvedValueOnce(updated);
    txRepo.update.mockResolvedValue(updated);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, { amount: 3500 } as any, OWNER_ID);

    // revert old credit: -3000; apply new credit: +3500
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, -3000);
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, 3500);
  });

  it('não reverte saldo quando status original é PENDING', async () => {
    const pending = makeExpense({ status: TransactionStatus.PENDING, amount: 100 });
    txRepo.findById.mockResolvedValueOnce(pending).mockResolvedValueOnce(
      makeExpense({ status: TransactionStatus.PENDING, amount: 200 }),
    );
    txRepo.update.mockResolvedValue(makeExpense());

    await useCase.execute(TXN_ID, { amount: 200 } as any, OWNER_ID);

    // revert not called for PENDING; re-apply also skipped for PENDING
    expect(acctRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('lança NotFoundException para transação inexistente', async () => {
    txRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TXN_ID, {} as any, OWNER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para transação de outro usuário', async () => {
    txRepo.findById.mockResolvedValue(makeExpense({ isOwnedBy: () => false }));
    await expect(useCase.execute(TXN_ID, {} as any, OWNER_ID)).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException para transferência', async () => {
    txRepo.findById.mockResolvedValue(makeTransfer());
    await expect(useCase.execute(TXN_ID, {} as any, OWNER_ID)).rejects.toThrow(BadRequestException);
  });
});

// ─── DeleteTransactionUseCase ─────────────────────────────────────────────────

describe('DeleteTransactionUseCase', () => {
  let useCase: DeleteTransactionUseCase;
  let txRepo: ReturnType<typeof makeTxRepo>;
  let acctRepo: ReturnType<typeof makeAcctRepo>;

  beforeEach(async () => {
    txRepo   = makeTxRepo();
    acctRepo = makeAcctRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
        { provide: ACCOUNT_REPOSITORY,     useValue: acctRepo },
      ],
    }).compile();

    useCase = module.get(DeleteTransactionUseCase);
    jest.clearAllMocks();
  });

  it('exclui despesa e reverte saldo', async () => {
    txRepo.findById.mockResolvedValue(makeExpense());
    txRepo.softDelete.mockResolvedValue(undefined);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, OWNER_ID);

    // reversão de despesa: +amount
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, 150);
    expect(txRepo.softDelete).toHaveBeenCalledWith(TXN_ID);
  });

  it('exclui receita e reverte saldo', async () => {
    txRepo.findById.mockResolvedValue(makeIncome());
    txRepo.softDelete.mockResolvedValue(undefined);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, OWNER_ID);

    // reversão de receita: -amount
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, -150);
  });

  it('não reverte saldo para transação PENDING', async () => {
    txRepo.findById.mockResolvedValue(makeExpense({ status: TransactionStatus.PENDING }));
    txRepo.softDelete.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, OWNER_ID);

    expect(acctRepo.updateBalance).not.toHaveBeenCalled();
  });

  it('exclui transferência e reverte saldo de ambas as partes', async () => {
    const primary = makeTransfer({ accountId: ACCT_ID, amount: 500 });
    const paired  = {
      ...makeTransfer({ id: 'txn-uuid-2', accountId: ACCT_B_ID, amount: 500 }),
      isIncome: () => true,
    };

    txRepo.findById.mockResolvedValue(primary);
    txRepo.findByTransferPairId.mockResolvedValue([primary, paired]);
    txRepo.softDelete.mockResolvedValue(undefined);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, OWNER_ID);

    expect(txRepo.findByTransferPairId).toHaveBeenCalledWith(PAIR_ID);
    // Primary side: expense-like debit => +amount reversal
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_ID, 500);
    // Pair side: income-like credit => -amount reversal
    expect(acctRepo.updateBalance).toHaveBeenCalledWith(ACCT_B_ID, -500);
    expect(txRepo.softDelete).toHaveBeenCalledWith(TXN_ID);
    expect(txRepo.softDelete).toHaveBeenCalledWith('txn-uuid-2');
  });

  it('exclui transferência mesmo sem par encontrado', async () => {
    const transfer = makeTransfer();
    txRepo.findById.mockResolvedValue(transfer);
    txRepo.findByTransferPairId.mockResolvedValue([transfer]); // apenas a própria
    txRepo.softDelete.mockResolvedValue(undefined);
    acctRepo.updateBalance.mockResolvedValue(undefined);

    await useCase.execute(TXN_ID, OWNER_ID);

    expect(txRepo.softDelete).toHaveBeenCalledWith(TXN_ID);
  });

  it('lança NotFoundException para transação inexistente', async () => {
    txRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TXN_ID, OWNER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para transação de outro usuário', async () => {
    txRepo.findById.mockResolvedValue(makeExpense({ isOwnedBy: () => false }));
    await expect(useCase.execute(TXN_ID, OWNER_ID)).rejects.toThrow(ForbiddenException);
  });
});

// ─── ListTransactionsUseCase ──────────────────────────────────────────────────

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let txRepo: ReturnType<typeof makeTxRepo>;

  beforeEach(async () => {
    txRepo = makeTxRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListTransactionsUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
      ],
    }).compile();

    useCase = module.get(ListTransactionsUseCase);
    jest.clearAllMocks();
  });

  it('lista transações com filtros padrão (sem parâmetros opcionais)', async () => {
    txRepo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const result = await useCase.execute({} as any, OWNER_ID);

    expect(txRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
      userId: OWNER_ID,
      page: 1,
      limit: 20,
    }));
    expect(result.total).toBe(0);
  });

  it('repassa filtros opcionais ao repositório', async () => {
    txRepo.findAll.mockResolvedValue({ data: [makeExpense()], total: 1, page: 1, limit: 10 });

    await useCase.execute({
      accountId: ACCT_ID,
      type: TransactionType.EXPENSE,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      page: 1,
      limit: 10,
    } as any, OWNER_ID);

    expect(txRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
      userId: OWNER_ID,
      accountId: ACCT_ID,
      type: TransactionType.EXPENSE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      page: 1,
      limit: 10,
    }));
  });
});

// ─── GetTransactionUseCase ────────────────────────────────────────────────────

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let txRepo: ReturnType<typeof makeTxRepo>;

  beforeEach(async () => {
    txRepo = makeTxRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: txRepo },
      ],
    }).compile();

    useCase = module.get(GetTransactionUseCase);
    jest.clearAllMocks();
  });

  it('retorna transação do usuário', async () => {
    txRepo.findById.mockResolvedValue(makeExpense());

    const result = await useCase.execute(TXN_ID, OWNER_ID);

    expect(result.id).toBe(TXN_ID);
  });

  it('lança NotFoundException para transação inexistente', async () => {
    txRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TXN_ID, OWNER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para transação de outro usuário', async () => {
    txRepo.findById.mockResolvedValue(makeExpense({ isOwnedBy: () => false }));
    await expect(useCase.execute(TXN_ID, OWNER_ID)).rejects.toThrow(ForbiddenException);
  });
});
