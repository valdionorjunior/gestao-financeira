import { Injectable, Inject } from '@nestjs/common';
import {
  ITransactionRepository, TRANSACTION_REPOSITORY,
} from '../../../domain/repositories/transaction.repository.interface';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';
import { IAccountRepository, ACCOUNT_REPOSITORY } from '../../../domain/repositories/account.repository.interface';
import { IGoalRepository, GOAL_REPOSITORY } from '../../../domain/repositories/goal.repository.interface';
import { AICategoryService, AIInsightsService, AIExpensePredictionService, AIChatService } from '../../../infrastructure/services/ai.service';
import { TransactionType } from '../../../domain/entities/transaction.entity';
import { GoalStatus } from '../../../domain/entities/budget-goal.entity';

@Injectable()
export class AICategorizationUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: ICategoryRepository,
    private readonly aiCategory: AICategoryService,
  ) {}

  async suggest(description: string, amount: number, userId: string) {
    const categories = await this.categoryRepo.findAll({ userId, includeInactive: false });
    return this.aiCategory.categorize(
      description,
      amount,
      categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
    );
  }
}

@Injectable()
export class AIInsightsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    private readonly aiInsights: AIInsightsService,
  ) {}

  async execute(userId: string) {
    const now   = new Date();
    const cStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [cIncome, cExpense, pExpense] = await Promise.all([
      this.txRepo.sumByPeriod(userId, TransactionType.INCOME,  cStart, cEnd),
      this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, cStart, cEnd),
      this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, pStart, pEnd),
    ]);

    const { data: txs } = await this.txRepo.findAll({ userId, startDate: cStart, endDate: cEnd, limit: 500, page: 1 });
    const byCategory: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.type === TransactionType.EXPENSE && tx.categoryId) {
        byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + Number(tx.amount);
      }
    }

    return this.aiInsights.generateInsights(
      { income: cIncome, expense: cExpense, byCategory },
      { income: 0, expense: pExpense },
    );
  }
}

@Injectable()
export class AIPredictionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo: ITransactionRepository,
    private readonly aiPrediction: AIExpensePredictionService,
  ) {}

  async execute(userId: string) {
    const now = new Date();
    const months: Array<{ month: string; expense: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const expense = await this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, start, end);
      months.push({
        month:   `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
        expense,
      });
    }

    const predicted = this.aiPrediction.predictNextMonth(months.map(m => ({ expense: m.expense })));
    return { history: months, predictedNextMonth: Math.round(predicted * 100) / 100 };
  }
}

@Injectable()
export class AIChatUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly txRepo:      ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)     private readonly accountRepo: IAccountRepository,
    @Inject(GOAL_REPOSITORY)        private readonly goalRepo:    IGoalRepository,
    private readonly aiChat: AIChatService,
  ) {}

  async execute(message: string, userId: string) {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [accounts, income, expense, txResult, allGoals] = await Promise.all([
      this.accountRepo.findAllByUserId(userId),
      this.txRepo.sumByPeriod(userId, TransactionType.INCOME,  start, end),
      this.txRepo.sumByPeriod(userId, TransactionType.EXPENSE, start, end),
      this.txRepo.findAll({ userId, startDate: start, endDate: end, limit: 200, page: 1 }),
      this.goalRepo.findAllByUser(userId),
    ]);

    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    const byCategory: Record<string, number> = {};
    for (const tx of txResult.data) {
      if (tx.type === TransactionType.EXPENSE && tx.categoryId) {
        byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + Number(tx.amount);
      }
    }
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));

    const goals = allGoals
      .filter(g => g.status === GoalStatus.ACTIVE || g.isAchieved())
      .map(g => ({
        name:            g.name,
        progressPercent: g.progressPercent(),
        remainingAmount: g.remainingAmount(),
        isAchieved:      g.isAchieved(),
        daysLeft:        g.targetDate
          ? Math.ceil((new Date(g.targetDate).getTime() - now.getTime()) / 86400000)
          : undefined,
      }));

    const response = await this.aiChat.chat(message, {
      totalBalance,
      monthlyIncome:   income,
      monthlyExpense:  expense,
      topCategories,
      goals,
    });

    return { response };
  }
}
