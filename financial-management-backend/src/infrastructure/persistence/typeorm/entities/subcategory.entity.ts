import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { CategoryEntity } from './category.entity';

@Entity('subcategories')
@Unique(['categoryId', 'name'])
export class SubcategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CategoryEntity, (cat) => cat.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 50 })
  icon: string;

  @Column({ nullable: true, length: 7 })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
