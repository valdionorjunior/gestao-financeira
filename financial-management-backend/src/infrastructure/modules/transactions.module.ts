import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity }    from '../persistence/typeorm/entities/transaction.entity';
import { AccountEntity }        from '../persistence/typeorm/entities/account.entity';
import { TransactionRepository } from '../repositories/transaction.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { AccountsModule }        from './accounts.module';
import { ACCOUNT_REPOSITORY }    from '../../domain/repositories/account.repository.interface';
import {
  CreateTransactionUseCase, CreateTransferUseCase, UpdateTransactionUseCase,
  DeleteTransactionUseCase, ListTransactionsUseCase, GetTransactionUseCase,
} from '../../application/use-cases/transactions/transaction.use-cases';
import { TransactionController } from '../../presentation/controllers/transaction.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity, AccountEntity]),
    AccountsModule,
  ],
  providers: [
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionRepository },
    CreateTransactionUseCase,
    CreateTransferUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionUseCase,
  ],
  controllers: [TransactionController],
  exports: [TRANSACTION_REPOSITORY],
})
export class TransactionsModule {}
