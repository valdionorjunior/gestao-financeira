import {
  Controller, Post, Get, Param, Body, UseGuards, UseInterceptors,
  UploadedFile, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard }    from '../guards/jwt-auth.guard';
import { CurrentUser }     from '../decorators/current-user.decorator';
import {
  ImportBankStatementUseCase, GetStatementItemsUseCase,
  ReconcileItemUseCase,       ListBankStatementsUseCase,
} from '../../application/use-cases/bank-statements/bank-statement.use-cases';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ReconcileItemDto {
  @ApiProperty({ enum: ['match', 'create', 'ignore'] })
  @IsEnum(['match', 'create', 'ignore'])
  action!: 'match' | 'create' | 'ignore';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

@ApiTags('bank-statements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-statements')
export class BankStatementController {
  constructor(
    private readonly importUseCase:    ImportBankStatementUseCase,
    private readonly getItemsUseCase:  GetStatementItemsUseCase,
    private readonly listUseCase:      ListBankStatementsUseCase,
    private readonly reconcileUseCase: ReconcileItemUseCase,
  ) {}

  @Post('import/:accountId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Importar extrato OFX ou CSV' })
  import(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.importUseCase.execute(file, accountId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar extratos importados' })
  findAll(@CurrentUser() user: any) {
    return this.listUseCase.execute(user.userId);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Listar itens do extrato' })
  getItems(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getItemsUseCase.execute(id, user.userId);
  }

  @Post(':id/items/:itemId/reconcile')
  @ApiOperation({ summary: 'Conciliar item: match, create ou ignore' })
  reconcile(
    @Param('id', ParseUUIDPipe) statementId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ReconcileItemDto,
    @CurrentUser() user: any,
  ) {
    return this.reconcileUseCase.execute(
      statementId, itemId, dto.action, user.userId, dto.transactionId, dto.categoryId,
    );
  }
}
