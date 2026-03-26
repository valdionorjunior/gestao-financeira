import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../persistence/typeorm/entities/category.entity';
import { SubcategoryEntity } from '../persistence/typeorm/entities/subcategory.entity';
import {
  ICategoryRepository, ISubcategoryRepository, CategoryFilter,
} from '../../domain/repositories/category.repository.interface';
import { Category, Subcategory } from '../../domain/entities/category.entity';
import { CategoryType } from '../../domain/entities/category.entity';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
  ) {}

  private toModel(e: CategoryEntity): Category {
    const c = new Category();
    Object.assign(c, e);
    return c;
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.repo.findOne({
      where: { id },
      relations: ['subcategories'],
    });
    return row ? this.toModel(row) : null;
  }

  async findAll(filter: CategoryFilter): Promise<Category[]> {
    const qb = this.repo.createQueryBuilder('c').leftJoinAndSelect('c.subcategories', 'sub');

    if (filter.userId !== undefined) {
      qb.andWhere('(c.user_id = :userId OR c.is_system = true)', { userId: filter.userId });
    }
    if (filter.isSystem !== undefined) {
      qb.andWhere('c.is_system = :isSystem', { isSystem: filter.isSystem });
    }
    if (filter.type) {
      qb.andWhere('c.type = :type', { type: filter.type });
    }
    if (!filter.includeInactive) {
      qb.andWhere('c.is_active = true');
    }
    qb.orderBy('c.is_system', 'DESC').addOrderBy('c.name', 'ASC');

    const rows = await qb.getMany();
    return rows.map(r => this.toModel(r));
  }

  async save(data: Partial<Category>): Promise<Category> {
    const entity = this.repo.create(data as Partial<CategoryEntity>);
    const saved = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.repo.update(id, data as Partial<CategoryEntity>);
    return this.findById(id) as Promise<Category>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsByNameAndUser(
    name: string, userId: string, type: CategoryType, excludeId?: string,
  ): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name) AND c.user_id = :userId AND c.type = :type', { name, userId, type });
    if (excludeId) qb.andWhere('c.id != :excludeId', { excludeId });
    return (await qb.getCount()) > 0;
  }
}

@Injectable()
export class SubcategoryRepository implements ISubcategoryRepository {
  constructor(
    @InjectRepository(SubcategoryEntity)
    private readonly repo: Repository<SubcategoryEntity>,
  ) {}

  private toModel(e: SubcategoryEntity): Subcategory {
    const s = new Subcategory();
    Object.assign(s, e);
    return s;
  }

  async findById(id: string): Promise<Subcategory | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toModel(row) : null;
  }

  async findByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const rows = await this.repo.find({
      where: { categoryId, isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map(r => this.toModel(r));
  }

  async save(data: Partial<Subcategory>): Promise<Subcategory> {
    const entity = this.repo.create(data as Partial<SubcategoryEntity>);
    const saved = await this.repo.save(entity);
    return this.toModel(saved);
  }

  async update(id: string, data: Partial<Subcategory>): Promise<Subcategory> {
    await this.repo.update(id, data as Partial<SubcategoryEntity>);
    return this.findById(id) as Promise<Subcategory>;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
