import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity }     from './user.entity';
import { FamilyEntity }   from './family.entity';
import { CategoryEntity } from './category.entity';

export enum BudgetPeriod { MONTHLY = 'MONTHLY', QUARTERLY = 'QUARTERLY', YEARLY = 'YEARLY', CUSTOM = 'CUSTOM' }

@Entity('budgets')
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => FamilyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'family_id' })
  family: FamilyEntity;

  @Column({ name: 'family_id', nullable: true })
  familyId: string;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: BudgetPeriod, default: BudgetPeriod.MONTHLY })
  period: BudgetPeriod;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'alert_threshold', type: 'decimal', precision: 5, scale: 2, default: 80 })
  alertThreshold: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
