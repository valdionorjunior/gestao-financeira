import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import {
  ImportBankStatementUseCase,
  GetStatementItemsUseCase,
  ReconcileItemUseCase,
  ListBankStatementsUseCase,
} from '@application/use-cases/bank-statements/bank-statement.use-cases';
import {
  BANK_STATEMENT_REPOSITORY,
  BANK_STATEMENT_ITEM_REPOSITORY,
} from '@domain/repositories/bank-statement.repository.interface';
import { ACCOUNT_REPOSITORY } from '@domain/repositories/account.repository.interface';
import { TRANSACTION_REPOSITORY } from '@domain/repositories/transaction.repository.interface';
import { OFXParserService, CSVParserService } from '@infrastructure/services/bank-parser.service';
import { ReconciliationStatus } from '@domain/entities/bank-statement.entity';
import { TransactionType } from '@domain/entities/transaction.entity';

// ─── IDs ────────────────────────────────────────────────────────────────────

const USER_ID       = 'user-uuid-1';
const OTHER_USER    = 'other-user';
const ACCOUNT_ID    = 'acct-uuid-1';
const STATEMENT_ID  = 'stmt-uuid-1';
const ITEM_ID       = 'item-uuid-1';
const TXN_ID        = 'txn-uuid-1';

// ─── Factories ──────────────────────────────────────────────────────────────

function makeStatementRepo() {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAllByUser: jest.fn(),
    update: jest.fn(),
  };
}

function makeItemRepo() {
  return {
    saveMany: jest.fn(),
    findByStatementId: jest.fn(),
    updateStatus: jest.fn(),
  };
}

function makeAccountRepo() {
  return {
    findById: jest.fn(),
    updateBalance: jest.fn(),
    save: jest.fn(),
    existsByNameAndUser: jest.fn(),
  };
}

function makeTxRepo() {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };
}

function makeOFXParser() {
  return { parse: jest.fn() };
}

function makeCSVParser() {
  return { parse: jest.fn() };
}

function makeStatement(overrides = {}) {
  return {
    id: STATEMENT_ID,
    userId: USER_ID,
    accountId: ACCOUNT_ID,
    filename: 'extrato.ofx',
    fileType: 'OFX',
    itemCount: 2,
    matchedCount: 0,
    ...overrides,
  };
}

function makeAccount(uid = USER_ID) {
  return {
    id: ACCOUNT_ID,
    userId: uid,
    isOwnedBy: (id: string) => id === uid,
  };
}

function makeItem(overrides = {}) {
  return {
    id: ITEM_ID,
    statementId: STATEMENT_ID,
    amount: 150,
    description: 'SUPERMERCADO',
    date: new Date('2024-01-15'),
    type: 'DEBIT',
    status: ReconciliationStatus.PENDING,
    ...overrides,
  };
}

// ─── ImportBankStatementUseCase ──────────────────────────────────────────────

describe('ImportBankStatementUseCase', () => {
  let useCase: ImportBankStatementUseCase;
  let statementRepo: ReturnType<typeof makeStatementRepo>;
  let itemRepo: ReturnType<typeof makeItemRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;
  let ofxParser: ReturnType<typeof makeOFXParser>;
  let csvParser: ReturnType<typeof makeCSVParser>;

  beforeEach(async () => {
    statementRepo = makeStatementRepo();
    itemRepo = makeItemRepo();
    accountRepo = makeAccountRepo();
    ofxParser = makeOFXParser();
    csvParser = makeCSVParser();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportBankStatementUseCase,
        { provide: BANK_STATEMENT_REPOSITORY,      useValue: statementRepo },
        { provide: BANK_STATEMENT_ITEM_REPOSITORY, useValue: itemRepo },
        { provide: ACCOUNT_REPOSITORY,             useValue: accountRepo },
        { provide: OFXParserService,               useValue: ofxParser },
        { provide: CSVParserService,               useValue: csvParser },
      ],
    }).compile();

    useCase = module.get(ImportBankStatementUseCase);
    jest.clearAllMocks();
  });

  it('importa arquivo OFX com sucesso', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    const entries = [makeItem(), makeItem({ id: 'item-uuid-2', description: 'FARMACIA' })];
    ofxParser.parse.mockReturnValue({
      entries,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    });
    statementRepo.save.mockResolvedValue(makeStatement());
    itemRepo.saveMany.mockResolvedValue(entries);

    const file = { buffer: Buffer.from('<OFX>...</OFX>'), originalname: 'extrato.ofx' } as Express.Multer.File;
    const result = await useCase.execute(file, ACCOUNT_ID, USER_ID);

    expect(ofxParser.parse).toHaveBeenCalled();
    expect(statementRepo.save).toHaveBeenCalledWith(expect.objectContaining({ fileType: 'OFX', userId: USER_ID }));
    expect(result.statement).toBeDefined();
    expect(result.itemCount).toBe(2);
  });

  it('importa arquivo CSV com sucesso', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());
    csvParser.parse.mockResolvedValue([makeItem({ type: 'CREDIT' })]);
    statementRepo.save.mockResolvedValue(makeStatement({ fileType: 'CSV' }));
    itemRepo.saveMany.mockResolvedValue([makeItem()]);

    const file = {
      buffer: Buffer.from('data,descricao,valor\n2024-01-15,SALARIO,3000'),
      originalname: 'extrato.csv',
    } as Express.Multer.File;

    const result = await useCase.execute(file, ACCOUNT_ID, USER_ID);

    expect(csvParser.parse).toHaveBeenCalled();
    expect(statementRepo.save).toHaveBeenCalledWith(expect.objectContaining({ fileType: 'CSV' }));
    expect(result.itemCount).toBe(1);
  });

  it('lança NotFoundException quando conta não existe', async () => {
    accountRepo.findById.mockResolvedValue(null);

    const file = { buffer: Buffer.from(''), originalname: 'extrato.ofx' } as Express.Multer.File;

    await expect(useCase.execute(file, ACCOUNT_ID, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para conta de outro usuário', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount(OTHER_USER));

    const file = { buffer: Buffer.from(''), originalname: 'extrato.ofx' } as Express.Multer.File;

    await expect(useCase.execute(file, ACCOUNT_ID, USER_ID)).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException para formato não suportado', async () => {
    accountRepo.findById.mockResolvedValue(makeAccount());

    const file = { buffer: Buffer.from(''), originalname: 'extrato.pdf' } as Express.Multer.File;

    await expect(useCase.execute(file, ACCOUNT_ID, USER_ID)).rejects.toThrow(BadRequestException);
  });
});

// ─── GetStatementItemsUseCase ────────────────────────────────────────────────

describe('GetStatementItemsUseCase', () => {
  let useCase: GetStatementItemsUseCase;
  let statementRepo: ReturnType<typeof makeStatementRepo>;
  let itemRepo: ReturnType<typeof makeItemRepo>;

  beforeEach(async () => {
    statementRepo = makeStatementRepo();
    itemRepo = makeItemRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetStatementItemsUseCase,
        { provide: BANK_STATEMENT_REPOSITORY,      useValue: statementRepo },
        { provide: BANK_STATEMENT_ITEM_REPOSITORY, useValue: itemRepo },
      ],
    }).compile();

    useCase = module.get(GetStatementItemsUseCase);
    jest.clearAllMocks();
  });

  it('retorna itens do extrato', async () => {
    statementRepo.findById.mockResolvedValue(makeStatement());
    itemRepo.findByStatementId.mockResolvedValue([makeItem()]);

    const result = await useCase.execute(STATEMENT_ID, USER_ID);

    expect(result).toHaveLength(1);
    expect(itemRepo.findByStatementId).toHaveBeenCalledWith(STATEMENT_ID);
  });

  it('lança NotFoundException para extrato inexistente', async () => {
    statementRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(STATEMENT_ID, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando extrato pertence a outro usuário', async () => {
    statementRepo.findById.mockResolvedValue(makeStatement({ userId: OTHER_USER }));

    await expect(useCase.execute(STATEMENT_ID, USER_ID)).rejects.toThrow(ForbiddenException);
  });
});

// ─── ReconcileItemUseCase ────────────────────────────────────────────────────

describe('ReconcileItemUseCase', () => {
  let useCase: ReconcileItemUseCase;
  let statementRepo: ReturnType<typeof makeStatementRepo>;
  let itemRepo: ReturnType<typeof makeItemRepo>;
  let txRepo: ReturnType<typeof makeTxRepo>;
  let accountRepo: ReturnType<typeof makeAccountRepo>;

  beforeEach(async () => {
    statementRepo = makeStatementRepo();
    itemRepo = makeItemRepo();
    txRepo = makeTxRepo();
    accountRepo = makeAccountRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconcileItemUseCase,
        { provide: BANK_STATEMENT_REPOSITORY,      useValue: statementRepo },
        { provide: BANK_STATEMENT_ITEM_REPOSITORY, useValue: itemRepo },
        { provide: TRANSACTION_REPOSITORY,         useValue: txRepo },
        { provide: ACCOUNT_REPOSITORY,             useValue: accountRepo },
      ],
    }).compile();

    useCase = module.get(ReconcileItemUseCase);
    jest.clearAllMocks();

    statementRepo.findById.mockResolvedValue(makeStatement());
    itemRepo.findByStatementId.mockResolvedValue([makeItem()]);
  });

  it('ignora item (action=ignore)', async () => {
    itemRepo.updateStatus.mockResolvedValue(undefined);

    const result = await useCase.execute(STATEMENT_ID, ITEM_ID, 'ignore', USER_ID);

    expect(itemRepo.updateStatus).toHaveBeenCalledWith(ITEM_ID, ReconciliationStatus.IGNORED);
    expect(result.status).toBe('ignored');
  });

  it('faz match com transação existente (action=match)', async () => {
    itemRepo.updateStatus.mockResolvedValue(undefined);

    const result = await useCase.execute(STATEMENT_ID, ITEM_ID, 'match', USER_ID, TXN_ID);

    expect(itemRepo.updateStatus).toHaveBeenCalledWith(ITEM_ID, ReconciliationStatus.MATCHED, TXN_ID);
    expect(result.status).toBe('matched');
    expect(result.transactionId).toBe(TXN_ID);
  });

  it('lança BadRequestException em match sem transactionId', async () => {
    await expect(
      useCase.execute(STATEMENT_ID, ITEM_ID, 'match', USER_ID, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it('cria nova transação para item DEBIT (action=create)', async () => {
    txRepo.save.mockResolvedValue({ id: TXN_ID, type: TransactionType.EXPENSE, amount: 150 });
    accountRepo.updateBalance.mockResolvedValue(undefined);
    itemRepo.updateStatus.mockResolvedValue(undefined);

    const result = await useCase.execute(STATEMENT_ID, ITEM_ID, 'create', USER_ID, undefined, 'cat-1');

    expect(txRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      type: TransactionType.EXPENSE,
      amount: 150,
    }));
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, -150);
    expect(result.status).toBe('created');
  });

  it('cria nova transação para item CREDIT (action=create)', async () => {
    itemRepo.findByStatementId.mockResolvedValue([makeItem({ type: 'CREDIT', amount: 3000 })]);
    txRepo.save.mockResolvedValue({ id: TXN_ID, type: TransactionType.INCOME, amount: 3000 });
    accountRepo.updateBalance.mockResolvedValue(undefined);
    itemRepo.updateStatus.mockResolvedValue(undefined);

    const result = await useCase.execute(STATEMENT_ID, ITEM_ID, 'create', USER_ID);

    expect(txRepo.save).toHaveBeenCalledWith(expect.objectContaining({ type: TransactionType.INCOME }));
    expect(accountRepo.updateBalance).toHaveBeenCalledWith(ACCOUNT_ID, 3000);
    expect(result.status).toBe('created');
  });

  it('lança NotFoundException quando extrato não existe', async () => {
    statementRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(STATEMENT_ID, ITEM_ID, 'ignore', USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException para extrato de outro usuário', async () => {
    statementRepo.findById.mockResolvedValue(makeStatement({ userId: OTHER_USER }));

    await expect(
      useCase.execute(STATEMENT_ID, ITEM_ID, 'ignore', USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança NotFoundException quando item não é encontrado no extrato', async () => {
    itemRepo.findByStatementId.mockResolvedValue([]);

    await expect(
      useCase.execute(STATEMENT_ID, 'non-existent-item', 'ignore', USER_ID),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── ListBankStatementsUseCase ───────────────────────────────────────────────

describe('ListBankStatementsUseCase', () => {
  let useCase: ListBankStatementsUseCase;
  let statementRepo: ReturnType<typeof makeStatementRepo>;

  beforeEach(async () => {
    statementRepo = makeStatementRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListBankStatementsUseCase,
        { provide: BANK_STATEMENT_REPOSITORY, useValue: statementRepo },
      ],
    }).compile();

    useCase = module.get(ListBankStatementsUseCase);
    jest.clearAllMocks();
  });

  it('retorna lista de extratos do usuário', async () => {
    statementRepo.findAllByUser.mockResolvedValue([makeStatement()]);

    const result = await useCase.execute(USER_ID);

    expect(statementRepo.findAllByUser).toHaveBeenCalledWith(USER_ID);
    expect(result).toHaveLength(1);
  });

  it('retorna lista vazia quando não há extratos', async () => {
    statementRepo.findAllByUser.mockResolvedValue([]);

    const result = await useCase.execute(USER_ID);

    expect(result).toEqual([]);
  });
});
