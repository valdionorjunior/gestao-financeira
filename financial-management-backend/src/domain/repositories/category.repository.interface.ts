import { Category, Subcategory } from '../entities/category.entity';
import { CategoryType } from '../entities/category.entity';

export interface CategoryFilter {
  userId?: string;
  familyId?: string;
  type?: CategoryType;
  isSystem?: boolean;
  includeInactive?: boolean;
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findAll(filter: CategoryFilter): Promise<Category[]>;
  save(data: Partial<Category>): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
  existsByNameAndUser(name: string, userId: string, type: CategoryType, excludeId?: string): Promise<boolean>;
}

export interface ISubcategoryRepository {
  findById(id: string): Promise<Subcategory | null>;
  findByCategoryId(categoryId: string): Promise<Subcategory[]>;
  save(data: Partial<Subcategory>): Promise<Subcategory>;
  update(id: string, data: Partial<Subcategory>): Promise<Subcategory>;
  delete(id: string): Promise<void>;
}

export const CATEGORY_REPOSITORY    = Symbol('ICategoryRepository');
export const SUBCATEGORY_REPOSITORY = Symbol('ISubcategoryRepository');
