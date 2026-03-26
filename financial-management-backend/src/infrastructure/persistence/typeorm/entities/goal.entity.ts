import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { UserEntity }            from './user.entity';
import { FamilyEntity }          from './family.entity';
import { AccountEntity }         from './account.entity';
import { GoalContributionEntity } from './goal-contribution.entity';

export enum GoalStatus { ACTIVE = 'ACTIVE', ACHIEVED = 'ACHIEVED', CANCELED = 'CANCELED', PAUSED = 'PAUSED' }

@Entity('goals')
export class GoalEntity {
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

  @ManyToOne(() => AccountEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'target_amount', type: 'decimal', precision: 15, scale: 2 })
  targetAmount: number;

  @Column({ name: 'current_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ name: 'target_date', type: 'date' })
  targetDate: string;

  @Column({ nullable: true, length: 50 })
  icon: string;

  @Column({ nullable: true, length: 7, default: '#82d616' })
  color: string;

  @Column({ type: 'enum', enum: GoalStatus, default: GoalStatus.ACTIVE })
  status: GoalStatus;

  @OneToMany(() => GoalContributionEntity, (c) => c.goal)
  contributions: GoalContributionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
