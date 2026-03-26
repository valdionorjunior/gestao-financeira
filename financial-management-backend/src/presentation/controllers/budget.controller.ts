import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe, ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateBudgetDto, UpdateBudgetDto } from '../../application/dtos/budgets/budget.dto';
import {
  CreateBudgetUseCase, UpdateBudgetUseCase,
  GetBudgetUseCase, DeleteBudgetUseCase,
} from '../../application/use-cases/budgets/budget.use-cases';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly createUseCase:  CreateBudgetUseCase,
    private readonly updateUseCase:  UpdateBudgetUseCase,
    private readonly getUseCase:     GetBudgetUseCase,
    private readonly deleteUseCase:  DeleteBudgetUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar orçamento' })
  create(@Body() dto: CreateBudgetDto, @CurrentUser() user: any) {
    return this.createUseCase.execute(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar orçamentos' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@CurrentUser() user: any, @Query('active') active?: string) {
    const activeFilter = active !== undefined ? active === 'true' : undefined;
    return this.getUseCase.findAll(user.userId, activeFilter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getUseCase.findOne(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar orçamento' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: any,
  ) {
    return this.updateUseCase.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir orçamento' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deleteUseCase.execute(id, user.userId);
  }
}
