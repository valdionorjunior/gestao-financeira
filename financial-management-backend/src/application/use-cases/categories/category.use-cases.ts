import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { ICategoryRepository, ISubcategoryRepository, CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY } from '../../../domain/repositories/category.repository.interface';
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateSubcategoryDto, UpdateSubcategoryDto,
} from '../../dtos/categories/category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: CreateCategoryDto, userId: string) {
    const exists = await this.categoryRepository.existsByNameAndUser(dto.name, userId, dto.type);
    if (exists) throw new ConflictException(`Categoria "${dto.name}" já existe`);

    return this.categoryRepository.save({
      userId,
      familyId: dto.familyId,
      name: dto.name,
      type: dto.type,
      icon: dto.icon,
      color: dto.color ?? '#8392ab',
      isSystem: false,
      isActive: true,
    });
  }
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateCategoryDto, userId: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    if (category.isSystem) throw new ForbiddenException('Categorias do sistema não podem ser editadas');
    if (!category.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    return this.categoryRepository.update(id, dto);
  }
}

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async findAll(userId: string, type?: any) {
    return this.categoryRepository.findAll({ userId, type, includeInactive: false });
  }

  async findSystemCategories() {
    return this.categoryRepository.findAll({ isSystem: true });
  }

  async findOne(id: string) {
    const cat = await this.categoryRepository.findById(id);
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    if (category.isSystem) throw new ForbiddenException('Categorias do sistema não podem ser excluídas');
    if (!category.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');
    await this.categoryRepository.delete(id);
  }
}

// ─── Subcategorias ────────────────────────────────────────────

@Injectable()
export class CreateSubcategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  async execute(categoryId: string, dto: CreateSubcategoryDto, userId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    if (!category.isSystem && !category.isOwnedBy(userId)) throw new ForbiddenException('Sem permissão');

    return this.subcategoryRepository.save({ categoryId, ...dto, isActive: true });
  }
}

@Injectable()
export class UpdateSubcategoryUseCase {
  constructor(
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateSubcategoryDto) {
    const sub = await this.subcategoryRepository.findById(id);
    if (!sub) throw new NotFoundException('Subcategoria não encontrada');
    return this.subcategoryRepository.update(id, dto);
  }
}

@Injectable()
export class DeleteSubcategoryUseCase {
  constructor(
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const sub = await this.subcategoryRepository.findById(id);
    if (!sub) throw new NotFoundException('Subcategoria não encontrada');
    await this.subcategoryRepository.delete(id);
  }
}
