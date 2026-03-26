import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity }           from '../persistence/typeorm/entities/category.entity';
import { SubcategoryEntity }        from '../persistence/typeorm/entities/subcategory.entity';
import { CategoryRepository }       from '../repositories/category.repository';
import { SubcategoryRepository }    from '../repositories/category.repository';
import {
  CATEGORY_REPOSITORY,
  SUBCATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import {
  CreateCategoryUseCase, UpdateCategoryUseCase,
  GetCategoryUseCase, DeleteCategoryUseCase,
  CreateSubcategoryUseCase, UpdateSubcategoryUseCase, DeleteSubcategoryUseCase,
} from '../../application/use-cases/categories/category.use-cases';
import { CategoryController } from '../../presentation/controllers/category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, SubcategoryEntity])],
  providers: [
    { provide: CATEGORY_REPOSITORY,    useClass: CategoryRepository },
    { provide: SUBCATEGORY_REPOSITORY, useClass: SubcategoryRepository },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    GetCategoryUseCase,
    DeleteCategoryUseCase,
    CreateSubcategoryUseCase,
    UpdateSubcategoryUseCase,
    DeleteSubcategoryUseCase,
  ],
  controllers: [CategoryController],
  exports: [CATEGORY_REPOSITORY, SUBCATEGORY_REPOSITORY],
})
export class CategoriesModule {}
