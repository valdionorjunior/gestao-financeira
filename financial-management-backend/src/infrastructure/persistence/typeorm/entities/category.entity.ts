import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FamilyEntity } from './family.entity';
import { SubcategoryEntity } from './subcategory.entity';

export enum CategoryType { INCOME = 'INCOME', EXPENSE = 'EXPENSE', TRANSFER = 'TRANSFER' }

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => FamilyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'family_id' })
  family: FamilyEntity;

  @Column({ name: 'family_id', nullable: true })
  familyId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ nullable: true, length: 50 })
  icon: string;

  @Column({ nullable: true, length: 7, default: '#8392ab' })
  color: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => SubcategoryEntity, (sub) => sub.category)
  subcategories: SubcategoryEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
