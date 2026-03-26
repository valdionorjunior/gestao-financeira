import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateGoalDto, UpdateGoalDto, AddContributionDto } from '../../application/dtos/goals/goal.dto';
import {
  CreateGoalUseCase, UpdateGoalUseCase,
  GetGoalUseCase, DeleteGoalUseCase,
  AddGoalContributionUseCase, GetGoalContributionsUseCase,
} from '../../application/use-cases/goals/goal.use-cases';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalController {
  constructor(
    private readonly createUseCase:        CreateGoalUseCase,
    private readonly updateUseCase:        UpdateGoalUseCase,
    private readonly getUseCase:           GetGoalUseCase,
    private readonly deleteUseCase:        DeleteGoalUseCase,
    private readonly addContribUseCase:    AddGoalContributionUseCase,
    private readonly getContribsUseCase:   GetGoalContributionsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar meta financeira' })
  create(@Body() dto: CreateGoalDto, @CurrentUser() user: any) {
    return this.createUseCase.execute(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar metas do usuário' })
  findAll(@CurrentUser() user: any) {
    return this.getUseCase.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar meta por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getUseCase.findOne(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar meta' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalDto,
    @CurrentUser() user: any,
  ) {
    return this.updateUseCase.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir meta' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deleteUseCase.execute(id, user.userId);
  }

  @Post(':id/contributions')
  @ApiOperation({ summary: 'Adicionar aporte à meta' })
  addContribution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddContributionDto,
    @CurrentUser() user: any,
  ) {
    return this.addContribUseCase.execute(id, dto, user.userId);
  }

  @Get(':id/contributions')
  @ApiOperation({ summary: 'Listar aportes da meta' })
  getContributions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.getContribsUseCase.execute(id, user.userId);
  }
}
