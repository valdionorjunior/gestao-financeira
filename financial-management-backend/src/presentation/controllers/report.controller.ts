import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard }    from '../guards/jwt-auth.guard';
import { CurrentUser }     from '../decorators/current-user.decorator';
import { ReportFilterDto, MonthlyReportDto } from '../../application/dtos/reports/report-filter.dto';
import {
  DashboardSummaryUseCase, MonthlyReportUseCase,
  CashFlowReportUseCase,   BudgetReportUseCase,
} from '../../application/use-cases/reports/report.use-cases';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly dashboardUseCase:  DashboardSummaryUseCase,
    private readonly monthlyUseCase:    MonthlyReportUseCase,
    private readonly cashFlowUseCase:   CashFlowReportUseCase,
    private readonly budgetUseCase:     BudgetReportUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumo do dashboard (mês atual)' })
  dashboard(@CurrentUser() user: any) {
    return this.dashboardUseCase.execute(user.userId);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Relatório mensal de receitas e despesas' })
  monthly(@Query() dto: MonthlyReportDto, @CurrentUser() user: any) {
    return this.monthlyUseCase.execute(dto, user.userId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Fluxo de caixa por período' })
  cashFlow(@Query() dto: ReportFilterDto, @CurrentUser() user: any) {
    return this.cashFlowUseCase.execute(dto, user.userId);
  }

  @Get('budgets')
  @ApiOperation({ summary: 'Relatório de orçamentos vs. gastos reais' })
  budgetReport(@CurrentUser() user: any) {
    return this.budgetUseCase.execute(user.userId);
  }
}
