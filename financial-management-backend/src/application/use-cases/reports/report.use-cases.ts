import { Injectable, Inject } from '@nestjs/common';
import {
  ITransactionRepository, TRANSACTION_REPOSITORY,
} from '../../../domain/repositories/transaction.repository.interface';
import { IBudgetRepository, BUDGET_REPOSITORY } from '../../../domain/repositories/budget.repository.interface';
import { IGoalRepository, GOAL_REPOSITORY } from '../../../domain/repositories/goal.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { TransactionType, TransactionStatus } from '../../../domain/entities/transaction.entity';
import { MonthlyReportDto, ReportFilterDto } from '../../dtos/reports/report-filter.dto';
import { parseDateString } from '../../../common/utils/date.utils';

@Injectable()
export class DashboardSummaryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo:      ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)     private readonly accountRepo: IAccountRepository,
    @Inject(BUDGET_REPOSITORY)      private readonly budgetRepo:  IBudgetRepository,
    @Inject(GOAL_REPOSITORY)        private readonly goalRepo:    IGoalRepository,
  ) {}

  async execute(userId: string) {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [accounts, income, expense, budgets, goals] = await Promise.all([
      this.accountRepo.findAllByUserId(userId),
      this.txRepo.sumByPeriod(userId, TransactionType.INCOME, start, end),
      this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, start, end),
      this.budgetRepo.findAllByUser(userId, true),
      this.goalRepo.findAllByUser(userId),
    ]);

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const netBalance   = income - expense;

    const budgetAlerts = budgets
      .filter(b => b.isAlertThresholdExceeded())
      .map(b => ({ id: b.id, categoryId: b.categoryId, percentUsed: b.percentUsed() }));

    const activeGoals = goals.filter(g => g.status === 'ACTIVE');
    const nearGoals   = activeGoals
      .filter(g => g.targetDate && new Date(g.targetDate) <= new Date(Date.now() + 30 * 86400000))
      .map(g => ({ id: g.id, name: g.name, progressPercent: g.progressPercent(), daysLeft: Math.ceil((new Date(g.targetDate!).getTime() - now.getTime()) / 86400000) }));

    return {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      totalBalance,
      monthlyIncome:    income,
      monthlyExpense:   expense,
      netBalance,
      accountsCount:    accounts.length,
      budgetAlerts,
      goalsSummary: {
        total:    activeGoals.length,
        nearDue:  nearGoals,
      },
    };
  }
}

@Injectable()
export class MonthlyReportUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
  ) {}

  async execute(dto: MonthlyReportDto, userId: string) {
    const now   = new Date();
    const year  = dto.year  ?? now.getFullYear();
    const month = dto.month ?? now.getMonth() + 1;

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const [income, expense] = await Promise.all([
      this.txRepo.sumByPeriod(userId, TransactionType.INCOME, start, end),
      this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, start, end),
    ]);

    const { data: transactions } = await this.txRepo.findAll({
      userId,
      startDate: start,
      endDate:   end,
      limit:     1000,
      page:      1,
      ...(dto.accountId ? { accountId: dto.accountId } : {}),
    });

    // group expenses by category
    const byCategory: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === TransactionType.EXPENSE && tx.categoryId) {
        byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + Number(tx.amount);
      }
    }

    const expenseByCategory = Object.entries(byCategory)
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);

    return {
      period: { year, month, startDate: start, endDate: end },
      income,
      expense,
      netBalance:  income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      expenseByCategory,
      transactionCount: transactions.length,
    };
  }
}

@Injectable()
export class CashFlowReportUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
  ) {}

  async execute(dto: ReportFilterDto, userId: string) {
    const start = dto.startDate ? parseDateString(dto.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end   = dto.endDate   ? parseDateString(dto.endDate)   : new Date();

    const months: Array<{ year: number; month: number; income: number; expense: number; net: number }> = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const mStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const mEnd   = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);

      const [income, expense] = await Promise.all([
        this.txRepo.sumByPeriod(userId, TransactionType.INCOME, mStart, mEnd),
        this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, mStart, mEnd),
      ]);

      months.push({ year: current.getFullYear(), month: current.getMonth() + 1, income, expense, net: income - expense });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return { cashFlow: months };
  }
}

@Injectable()
export class BudgetReportUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY)      private readonly budgetRepo: IBudgetRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo:     ITransactionRepository,
  ) {}

  async execute(userId: string) {
    const budgets = await this.budgetRepo.findAllByUser(userId, true);

    return budgets.map(b => ({
      id:              b.id,
      categoryId:      b.categoryId,
      period:          b.period,
      amount:          b.amount,
      spentAmount:     b.spentAmount,
      remainingAmount: Math.max(b.amount - b.spentAmount, 0),
      percentUsed:     b.percentUsed(),
      isOverBudget:    b.isOverBudget(),
      alertTriggered:  b.isAlertThresholdExceeded(),
      startDate:       b.startDate,
      endDate:         b.endDate,
    }));
  }
}
