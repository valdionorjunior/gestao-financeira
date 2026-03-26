import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateSubcategoryDto, UpdateSubcategoryDto,
} from '../../application/dtos/categories/category.dto';
import {
  CreateCategoryUseCase, UpdateCategoryUseCase,
  GetCategoryUseCase, DeleteCategoryUseCase,
  CreateSubcategoryUseCase, UpdateSubcategoryUseCase, DeleteSubcategoryUseCase,
} from '../../application/use-cases/categories/category.use-cases';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase:     CreateCategoryUseCase,
    private readonly updateCategoryUseCase:     UpdateCategoryUseCase,
    private readonly getCategoryUseCase:        GetCategoryUseCase,
    private readonly deleteCategoryUseCase:     DeleteCategoryUseCase,
    private readonly createSubcategoryUseCase:  CreateSubcategoryUseCase,
    private readonly updateSubcategoryUseCase:  UpdateSubcategoryUseCase,
    private readonly deleteSubcategoryUseCase:  DeleteSubcategoryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.createCategoryUseCase.execute(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias do usuário + sistema' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT'] })
  findAll(@CurrentUser() user: any, @Query('type') type?: string) {
    return this.getCategoryUseCase.findAll(user.userId, type);
  }

  @Get('system')
  @ApiOperation({ summary: 'Listar categorias do sistema' })
  findSystem() {
    return this.getCategoryUseCase.findSystemCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getCategoryUseCase.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.updateCategoryUseCase.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir categoria' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deleteCategoryUseCase.execute(id, user.userId);
  }

  // ── Subcategories ──────────────────────────────────────────────

  @Post(':id/subcategories')
  @ApiOperation({ summary: 'Criar subcategoria' })
  createSub(
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() dto: CreateSubcategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.createSubcategoryUseCase.execute(categoryId, dto, user.userId);
  }

  @Put(':id/subcategories/:sid')
  @ApiOperation({ summary: 'Atualizar subcategoria' })
  updateSub(
    @Param('id', ParseUUIDPipe) _categoryId: string,
    @Param('sid', ParseUUIDPipe) subId: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.updateSubcategoryUseCase.execute(subId, dto);
  }

  @Delete(':id/subcategories/:sid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir subcategoria' })
  removeSub(
    @Param('id', ParseUUIDPipe) _categoryId: string,
    @Param('sid', ParseUUIDPipe) subId: string,
  ) {
    return this.deleteSubcategoryUseCase.execute(subId);
  }
}
