import { Module }       from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule }  from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BankStatementEntity }     from '../persistence/typeorm/entities/bank-statement.entity';
import { BankStatementItemEntity } from '../persistence/typeorm/entities/bank-statement-item.entity';
import {
  BankStatementRepository, BankStatementItemRepository,
} from '../repositories/bank-statement.repository';
import {
  BANK_STATEMENT_REPOSITORY, BANK_STATEMENT_ITEM_REPOSITORY,
} from '../../domain/repositories/bank-statement.repository.interface';
import { AccountsModule }     from './accounts.module';
import { TransactionsModule } from './transactions.module';
import { OFXParserService, CSVParserService } from '../services/bank-parser.service';
import {
  ImportBankStatementUseCase, GetStatementItemsUseCase,
  ReconcileItemUseCase,       ListBankStatementsUseCase,
} from '../../application/use-cases/bank-statements/bank-statement.use-cases';
import { BankStatementController } from '../../presentation/controllers/bank-statement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankStatementEntity, BankStatementItemEntity]),
    MulterModule.register({ storage: memoryStorage() }),
    AccountsModule,
    TransactionsModule,
  ],
  providers: [
    { provide: BANK_STATEMENT_REPOSITORY,      useClass: BankStatementRepository },
    { provide: BANK_STATEMENT_ITEM_REPOSITORY, useClass: BankStatementItemRepository },
    OFXParserService,
    CSVParserService,
    ImportBankStatementUseCase,
    GetStatementItemsUseCase,
    ReconcileItemUseCase,
    ListBankStatementsUseCase,
  ],
  controllers: [BankStatementController],
})
export class BankStatementsModule {}
