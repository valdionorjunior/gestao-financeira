import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from '../persistence/typeorm/entities/transaction.entity';
import { AccountEntity }     from '../persistence/typeorm/entities/account.entity';
import { BudgetEntity }      from '../persistence/typeorm/entities/budget.entity';
import { GoalEntity }        from '../persistence/typeorm/entities/goal.entity';
import { TransactionsModule } from './transactions.module';
import { AccountsModule }     from './accounts.module';
import { BudgetsGoalsModule } from './budgets-goals.module';
import {
  DashboardSummaryUseCase, MonthlyReportUseCase,
  CashFlowReportUseCase,   BudgetReportUseCase,
} from '../../application/use-cases/reports/report.use-cases';
import { ReportController } from '../../presentation/controllers/report.controller';

@Module({
  imports: [TransactionsModule, AccountsModule, BudgetsGoalsModule],
  providers: [
    DashboardSummaryUseCase,
    MonthlyReportUseCase,
    CashFlowReportUseCase,
    BudgetReportUseCase,
  ],
  controllers: [ReportController],
})
export class ReportsModule {}
