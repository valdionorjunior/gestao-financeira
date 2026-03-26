import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  CreateTransactionDto, UpdateTransactionDto, ListTransactionsDto,
} from '../../application/dtos/transactions/transaction.dto';
import {
  CreateTransactionUseCase, CreateTransferUseCase, UpdateTransactionUseCase,
  DeleteTransactionUseCase, ListTransactionsUseCase, GetTransactionUseCase,
} from '../../application/use-cases/transactions/transaction.use-cases';
import { TransactionType } from '../../domain/entities/transaction.entity';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createUseCase:   CreateTransactionUseCase,
    private readonly transferUseCase: CreateTransferUseCase,
    private readonly updateUseCase:   UpdateTransactionUseCase,
    private readonly deleteUseCase:   DeleteTransactionUseCase,
    private readonly listUseCase:     ListTransactionsUseCase,
    private readonly getUseCase:      GetTransactionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar receita ou despesa' })
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.createUseCase.execute(dto, user.userId);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Registrar transferência entre contas' })
  createTransfer(@Body() dto: CreateTransactionDto, @CurrentUser() user: any) {
    const payload = { ...dto, type: TransactionType.TRANSFER };
    return this.transferUseCase.execute(payload, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações com filtros e paginação' })
  findAll(@Query() query: ListTransactionsDto, @CurrentUser() user: any) {
    return this.listUseCase.execute(query, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getUseCase.execute(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.updateUseCase.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir transação (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deleteUseCase.execute(id, user.userId);
  }
}
