import {
  Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import {
  IBankStatementRepository, IBankStatementItemRepository,
  BANK_STATEMENT_REPOSITORY, BANK_STATEMENT_ITEM_REPOSITORY,
} from '../../../domain/repositories/bank-statement.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import {
  ITransactionRepository, TRANSACTION_REPOSITORY,
} from '../../../domain/repositories/transaction.repository.interface';
import { ReconciliationStatus } from '../../../domain/entities/bank-statement.entity';
import { TransactionType, TransactionStatus } from '../../../domain/entities/transaction.entity';
import { OFXParserService, CSVParserService } from '../../../infrastructure/services/bank-parser.service';

// ─── Import Statement ─────────────────────────────────────────

@Injectable()
export class ImportBankStatementUseCase {
  constructor(
    @Inject(BANK_STATEMENT_REPOSITORY)      private readonly statementRepo: IBankStatementRepository,
    @Inject(BANK_STATEMENT_ITEM_REPOSITORY) private readonly itemRepo:      IBankStatementItemRepository,
    @Inject(ACCOUNT_REPOSITORY)             private readonly accountRepo:   IAccountRepository,
    private readonly ofxParser: OFXParserService,
    private readonly csvParser: CSVParserService,
  ) {}

  async execute(
    file: Express.Multer.File,
    accountId: string,
    userId: string,
  ) {
    const account = await this.accountRepo.findById(accountId);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');

    const content  = file.buffer.toString('utf-8');
    const filename = file.originalname;
    const isOFX    = filename.toLowerCase().endsWith('.ofx');
    const isCSV    = filename.toLowerCase().endsWith('.csv');

    if (!isOFX && !isCSV) {
      throw new BadRequestException('Formato não suportado. Use OFX ou CSV.');
    }

    let entries: any[];
    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (isOFX) {
      const result = this.ofxParser.parse(content);
      entries = result.entries;
      periodStart = result.periodStart;
      periodEnd   = result.periodEnd;
    } else {
      entries = await this.csvParser.parse(content);
      periodStart = entries[entries.length - 1]?.date;
      periodEnd   = entries[0]?.date;
    }

    const statement = await this.statementRepo.save({
      userId,
      accountId,
      filename,
      fileType:   isOFX ? 'OFX' : 'CSV',
      importedAt: new Date(),
      itemCount:  entries.length,
      matchedCount: 0,
      periodStart,
      periodEnd,
    });

    const items = await this.itemRepo.saveMany(
      entries.map(e => ({
        statementId: statement.id,
        externalId:  e.externalId,
        type:        e.type,
        amount:      e.amount,
        description: e.description,
        date:        e.date,
        status:      ReconciliationStatus.PENDING,
      })),
    );

    return { statement, itemCount: items.length };
  }
}

// ─── Get Statement Items ──────────────────────────────────────

@Injectable()
export class GetStatementItemsUseCase {
  constructor(
    @Inject(BANK_STATEMENT_REPOSITORY)      private readonly statementRepo: IBankStatementRepository,
    @Inject(BANK_STATEMENT_ITEM_REPOSITORY) private readonly itemRepo:      IBankStatementItemRepository,
  ) {}

  async execute(statementId: string, userId: string) {
    const stmt = await this.statementRepo.findById(statementId);
    if (!stmt) throw new NotFoundException('Extrato não encontrado');
    if (stmt.userId !== userId) throw new ForbiddenException('Sem permissão');
    return this.itemRepo.findByStatementId(statementId);
  }
}

// ─── Reconcile Item ───────────────────────────────────────────

@Injectable()
export class ReconcileItemUseCase {
  constructor(
    @Inject(BANK_STATEMENT_REPOSITORY)      private readonly statementRepo: IBankStatementRepository,
    @Inject(BANK_STATEMENT_ITEM_REPOSITORY) private readonly itemRepo:      IBankStatementItemRepository,
    @Inject(TRANSACTION_REPOSITORY)         private readonly txRepo:        ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)             private readonly accountRepo:   IAccountRepository,
  ) {}

  async execute(
    statementId: string,
    itemId: string,
    action: 'match' | 'create' | 'ignore',
    userId: string,
    transactionId?: string,
    categoryId?: string,
  ) {
    const stmt = await this.statementRepo.findById(statementId);
    if (!stmt) throw new NotFoundException('Extrato não encontrado');
    if (stmt.userId !== userId) throw new ForbiddenException('Sem permissão');

    const items      = await this.itemRepo.findByStatementId(statementId);
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) throw new NotFoundException('Item não encontrado');

    if (action === 'ignore') {
      await this.itemRepo.updateStatus(itemId, ReconciliationStatus.IGNORED);
      return { status: 'ignored' };
    }

    if (action === 'match') {
      if (!transactionId) throw new BadRequestException('transactionId é obrigatório para match');
      await this.itemRepo.updateStatus(itemId, ReconciliationStatus.MATCHED, transactionId);
      return { status: 'matched', transactionId };
    }

    // action === 'create' — create a new transaction from the item
    const txType = targetItem.type === 'CREDIT' ? TransactionType.INCOME : TransactionType.EXPENSE;
    const tx     = await this.txRepo.save({
      userId,
      accountId:   stmt.accountId,
      type:        txType,
      status:      TransactionStatus.CONFIRMED,
      amount:      targetItem.amount,
      description: targetItem.description,
      date:        targetItem.date,
      categoryId,
      isRecurring: false,
    });

    const delta = txType === TransactionType.INCOME ? targetItem.amount : -targetItem.amount;
    await this.accountRepo.updateBalance(stmt.accountId, delta);
    await this.itemRepo.updateStatus(itemId, ReconciliationStatus.MATCHED, tx.id);

    return { status: 'created', transaction: tx };
  }
}

// ─── List Statements ─────────────────────────────────────────

@Injectable()
export class ListBankStatementsUseCase {
  constructor(
    @Inject(BANK_STATEMENT_REPOSITORY) private readonly statementRepo: IBankStatementRepository,
  ) {}

  execute(userId: string) {
    return this.statementRepo.findAllByUser(userId);
  }
}
