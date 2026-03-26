import {
  Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  ITransactionRepository, TRANSACTION_REPOSITORY, TransactionFilter,
} from '../../../domain/repositories/transaction.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '../../../domain/entities/transaction.entity';
import {
  CreateTransactionDto, UpdateTransactionDto, ListTransactionsDto,
} from '../../dtos/transactions/transaction.dto';

// ─── Create ──────────────────────────────────────────────────────────────────

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(dto: CreateTransactionDto, userId: string) {
    const account = await this.accountRepo.findById(dto.accountId);
    if (!account) throw new NotFoundException('Conta não encontrada');
    if (!account.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão sobre a conta');

    if (dto.type === TransactionType.TRANSFER) {
      throw new BadRequestException('Use o endpoint /transactions/transfer para transferências');
    }

    const balanceDelta = dto.type === TransactionType.INCOME ? dto.amount : -dto.amount;

    const transaction = await this.transactionRepo.save({
      userId,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      type: dto.type,
      status: dto.status ?? TransactionStatus.CONFIRMED,
      amount: dto.amount,
      description: dto.description,
      notes: dto.notes,
      date: new Date(dto.date),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      isRecurring: dto.isRecurring ?? false,
      recurrenceRule: dto.recurrenceRule,
      tags: dto.tags,
    });

    if (transaction.status === TransactionStatus.CONFIRMED) {
      await this.accountRepo.updateBalance(dto.accountId, balanceDelta);
    }

    return transaction;
  }
}

// ─── Create Transfer ─────────────────────────────────────────────────────────

@Injectable()
export class CreateTransferUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(dto: CreateTransactionDto, userId: string) {
    if (!dto.destinationAccountId) {
      throw new BadRequestException('destinationAccountId é obrigatório para transferências');
    }
    if (dto.accountId === dto.destinationAccountId) {
      throw new BadRequestException('Conta origem e destino não podem ser iguais');
    }

    const [origin, destination] = await Promise.all([
      this.accountRepo.findById(dto.accountId),
      this.accountRepo.findById(dto.destinationAccountId),
    ]);

    if (!origin)      throw new NotFoundException('Conta origem não encontrada');
    if (!destination) throw new NotFoundException('Conta destino não encontrada');
    if (!origin.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão sobre conta origem');

    const transferPairId = uuidv4();
    const date = new Date(dto.date);

    const [debit, credit] = await Promise.all([
      this.transactionRepo.save({
        userId,
        accountId: dto.accountId,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.CONFIRMED,
        amount: dto.amount,
        description: dto.description,
        notes: dto.notes,
        date,
        transferPairId,
        isRecurring: false,
      }),
      this.transactionRepo.save({
        userId,
        accountId: dto.destinationAccountId!,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.CONFIRMED,
        amount: dto.amount,
        description: dto.description,
        notes: dto.notes,
        date,
        transferPairId,
        isRecurring: false,
      }),
    ]);

    await Promise.all([
      this.accountRepo.updateBalance(dto.accountId, -dto.amount),
      this.accountRepo.updateBalance(dto.destinationAccountId!, dto.amount),
    ]);

    return { debit, credit, transferPairId };
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(id: string, dto: UpdateTransactionDto, userId: string) {
    const tx = await this.transactionRepo.findById(id);
    if (!tx) throw new NotFoundException('Transação não encontrada');
    if (!tx.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    if (tx.isTransfer()) throw new BadRequestException('Transferências não podem ser editadas individualmente');

    // revert old balance if status was confirmed
    if (tx.status === TransactionStatus.CONFIRMED && dto.amount !== undefined) {
      const oldDelta = tx.isIncome() ? tx.amount : -tx.amount;
      await this.accountRepo.updateBalance(tx.accountId, -oldDelta);
    }

    const updated = await this.transactionRepo.update(id, {
      categoryId:    dto.categoryId,
      subcategoryId: dto.subcategoryId,
      amount:        dto.amount,
      description:   dto.description,
      notes:         dto.notes,
      date:          dto.date ? new Date(dto.date) : undefined,
      dueDate:       dto.dueDate ? new Date(dto.dueDate) : undefined,
      status:        dto.status,
      tags:          dto.tags,
    });

    // apply new balance
    const finalTx = await this.transactionRepo.findById(id);
    if (finalTx && finalTx.status === TransactionStatus.CONFIRMED) {
      const newDelta = finalTx.isIncome() ? finalTx.amount : -finalTx.amount;
      await this.accountRepo.updateBalance(finalTx.accountId, newDelta);
    }

    return updated;
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const tx = await this.transactionRepo.findById(id);
    if (!tx) throw new NotFoundException('Transação não encontrada');
    if (!tx.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');

    if (tx.status === TransactionStatus.CONFIRMED) {
      const delta = tx.isIncome() ? -tx.amount : tx.amount;
      await this.accountRepo.updateBalance(tx.accountId, delta);
    }

    if (tx.isTransfer() && tx.transferPairId) {
      const pair = await this.transactionRepo.findByTransferPairId(tx.transferPairId);
      const other = pair.find(p => p.id !== id);
      if (other) {
        const otherDelta = other.isIncome() ? -other.amount : other.amount;
        await this.accountRepo.updateBalance(other.accountId, otherDelta);
        await this.transactionRepo.softDelete(other.id);
      }
    }

    await this.transactionRepo.softDelete(id);
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(dto: ListTransactionsDto, userId: string) {
    const filter: TransactionFilter = {
      userId,
      accountId:   dto.accountId,
      categoryId:  dto.categoryId,
      type:        dto.type,
      status:      dto.status,
      startDate:   dto.startDate  ? new Date(dto.startDate)  : undefined,
      endDate:     dto.endDate    ? new Date(dto.endDate)    : undefined,
      description: dto.description,
      page:        dto.page  ?? 1,
      limit:       dto.limit ?? 20,
    };
    return this.transactionRepo.findAll(filter);
  }
}

// ─── Get One ─────────────────────────────────────────────────────────────────

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(id: string, userId: string) {
    const tx = await this.transactionRepo.findById(id);
    if (!tx) throw new NotFoundException('Transação não encontrada');
    if (!tx.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return tx;
  }
}
