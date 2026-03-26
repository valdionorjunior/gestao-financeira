import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { GoalEntity }        from './goal.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('goal_contributions')
export class GoalContributionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GoalEntity, (goal) => goal.contributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: GoalEntity;

  @Column({ name: 'goal_id' })
  goalId: string;

  @ManyToOne(() => TransactionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;

  @Column({ nullable: true, length: 255 })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
