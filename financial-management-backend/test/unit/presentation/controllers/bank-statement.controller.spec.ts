import { Test, TestingModule } from '@nestjs/testing';
import { BankStatementController } from '@presentation/controllers/bank-statement.controller';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import {
  ImportBankStatementUseCase, GetStatementItemsUseCase,
  ReconcileItemUseCase, ListBankStatementsUseCase,
} from '@application/use-cases/bank-statements/bank-statement.use-cases';

const mockImportUseCase    = { execute: jest.fn() };
const mockGetItemsUseCase  = { execute: jest.fn() };
const mockListUseCase      = { execute: jest.fn() };
const mockReconcileUseCase = { execute: jest.fn() };

const USER = { userId: 'user-uuid-1' };
const ACCOUNT_ID   = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const STATEMENT_ID = 'b1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ITEM_ID      = 'c1b2c3d4-e5f6-7890-abcd-ef1234567890';

const STATEMENT = {
  id: STATEMENT_ID,
  userId: USER.userId,
  accountId: ACCOUNT_ID,
  filename: 'extrato.ofx',
  fileType: 'OFX',
  itemCount: 10,
  matchedCount: 0,
};

const ITEM = {
  id: ITEM_ID,
  statementId: STATEMENT_ID,
  amount: 150.00,
  description: 'SUPERMERCADO',
  date: new Date('2024-01-15'),
  type: 'EXPENSE',
  reconciliationStatus: 'PENDING',
};

describe('BankStatementController', () => {
  let controller: BankStatementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankStatementController],
      providers: [
        { provide: ImportBankStatementUseCase,  useValue: mockImportUseCase },
        { provide: GetStatementItemsUseCase,    useValue: mockGetItemsUseCase },
        { provide: ListBankStatementsUseCase,   useValue: mockListUseCase },
        { provide: ReconcileItemUseCase,        useValue: mockReconcileUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get(BankStatementController);
    jest.clearAllMocks();
  });

  describe('POST /bank-statements/import/:accountId → import()', () => {
    it('delega importação para ImportBankStatementUseCase', async () => {
      mockImportUseCase.execute.mockResolvedValue(STATEMENT);

      const mockFile = {
        buffer: Buffer.from('<OFX>...</OFX>'),
        originalname: 'extrato.ofx',
        mimetype: 'text/plain',
      } as Express.Multer.File;

      const result = await controller.import(ACCOUNT_ID, mockFile, USER);

      expect(mockImportUseCase.execute).toHaveBeenCalledWith(mockFile, ACCOUNT_ID, USER.userId);
      expect(result).toEqual(STATEMENT);
    });

    it('delega importação de CSV', async () => {
      mockImportUseCase.execute.mockResolvedValue({ ...STATEMENT, fileType: 'CSV' });

      const mockFile = {
        buffer: Buffer.from('date,desc,amount\n2024-01-15,SUPERMERCADO,-150'),
        originalname: 'extrato.csv',
      } as Express.Multer.File;

      await controller.import(ACCOUNT_ID, mockFile, USER);

      expect(mockImportUseCase.execute).toHaveBeenCalledWith(mockFile, ACCOUNT_ID, USER.userId);
    });
  });

  describe('GET /bank-statements → findAll()', () => {
    it('lista extratos importados do usuário', async () => {
      mockListUseCase.execute.mockResolvedValue([STATEMENT]);

      const result = await controller.findAll(USER);

      expect(mockListUseCase.execute).toHaveBeenCalledWith(USER.userId);
      expect(result).toHaveLength(1);
    });

    it('retorna lista vazia quando não há extratos', async () => {
      mockListUseCase.execute.mockResolvedValue([]);

      const result = await controller.findAll(USER);

      expect(result).toEqual([]);
    });
  });

  describe('GET /bank-statements/:id/items → getItems()', () => {
    it('lista itens do extrato por ID', async () => {
      mockGetItemsUseCase.execute.mockResolvedValue([ITEM]);

      const result = await controller.getItems(STATEMENT_ID, USER);

      expect(mockGetItemsUseCase.execute).toHaveBeenCalledWith(STATEMENT_ID, USER.userId);
      expect(result).toHaveLength(1);
    });
  });

  describe('POST /bank-statements/:id/items/:itemId/reconcile → reconcile()', () => {
    it('concilia item com transação existente (match)', async () => {
      const reconciled = { status: 'matched', transactionId: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' };
      mockReconcileUseCase.execute.mockResolvedValue(reconciled);

      const txnId = 'd1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const result = await controller.reconcile(
        STATEMENT_ID,
        ITEM_ID,
        { action: 'match', transactionId: txnId },
        USER,
      );

      expect(mockReconcileUseCase.execute).toHaveBeenCalledWith(
        STATEMENT_ID, ITEM_ID, 'match', USER.userId, txnId, undefined,
      );
      expect(result.status).toBe('matched');
    });

    it('cria nova transação para item (create)', async () => {
      const catId = 'e1b2c3d4-e5f6-7890-abcd-ef1234567890';
      mockReconcileUseCase.execute.mockResolvedValue({ status: 'created' });

      await controller.reconcile(
        STATEMENT_ID,
        ITEM_ID,
        { action: 'create', categoryId: catId },
        USER,
      );

      expect(mockReconcileUseCase.execute).toHaveBeenCalledWith(
        STATEMENT_ID, ITEM_ID, 'create', USER.userId, undefined, catId,
      );
    });

    it('ignora item (ignore)', async () => {
      mockReconcileUseCase.execute.mockResolvedValue({ status: 'ignored' });

      await controller.reconcile(STATEMENT_ID, ITEM_ID, { action: 'ignore' }, USER);

      expect(mockReconcileUseCase.execute).toHaveBeenCalledWith(
        STATEMENT_ID, ITEM_ID, 'ignore', USER.userId, undefined, undefined,
      );
    });
  });
});
