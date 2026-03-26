import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { InvestmentEntity } from './investment.entity';

export enum InvestmentContributionType {
  BUY = 'BUY', SELL = 'SELL', DIVIDEND = 'DIVIDEND', INTEREST = 'INTEREST', BONUS = 'BONUS',
}

@Entity('investment_contributions')
export class InvestmentContributionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InvestmentEntity, (inv) => inv.contributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investment_id' })
  investment: InvestmentEntity;

  @Column({ name: 'investment_id' })
  investmentId: string;

  @Column({ type: 'enum', enum: InvestmentContributionType })
  type: InvestmentContributionType;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: string;

  @Column({ nullable: true, length: 255 })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
