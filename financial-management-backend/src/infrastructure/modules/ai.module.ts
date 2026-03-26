import { Module } from '@nestjs/common';
import { TransactionsModule }  from './transactions.module';
import { CategoriesModule }    from './categories.module';
import { AccountsModule }      from './accounts.module';
import { BudgetsGoalsModule }  from './budgets-goals.module';
import { AICategoryService, AIInsightsService, AIExpensePredictionService, AIChatService } from '../services/ai.service';
import { AICategorizationUseCase, AIInsightsUseCase, AIPredictionUseCase, AIChatUseCase } from '../../application/use-cases/ai/ai.use-cases';
import { AIController } from '../../presentation/controllers/ai.controller';

@Module({
  imports: [TransactionsModule, CategoriesModule, AccountsModule, BudgetsGoalsModule],
  providers: [
    AICategoryService,
    AIInsightsService,
    AIExpensePredictionService,
    AIChatService,
    AICategorizationUseCase,
    AIInsightsUseCase,
    AIPredictionUseCase,
    AIChatUseCase,
  ],
  controllers: [AIController],
})
export class AIModule {}
