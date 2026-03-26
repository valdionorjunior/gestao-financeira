import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard }       from '../guards/jwt-auth.guard';
import { CurrentUser }        from '../decorators/current-user.decorator';
import { CreateAccountDto }   from '../../application/dtos/accounts/create-account.dto';
import { UpdateAccountDto }   from '../../application/dtos/accounts/update-account.dto';
import { CreateAccountUseCase } from '../../application/use-cases/accounts/create-account.use-case';
import { UpdateAccountUseCase } from '../../application/use-cases/accounts/update-account.use-case';
import { GetAccountUseCase, DeleteAccountUseCase } from '../../application/use-cases/accounts/get-account.use-case';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createUseCase:  CreateAccountUseCase,
    private readonly updateUseCase:  UpdateAccountUseCase,
    private readonly getUseCase:     GetAccountUseCase,
    private readonly deleteUseCase:  DeleteAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta bancária' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateAccountDto, @CurrentUser() user: any) {
    return this.createUseCase.execute(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas do usuário' })
  findAll(@CurrentUser() user: any) {
    return this.getUseCase.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getUseCase.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser() user: any,
  ) {
    return this.updateUseCase.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir conta (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deleteUseCase.execute(id, user.userId);
  }
}
