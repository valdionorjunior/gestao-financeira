import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { UserEntity }                     from './user.entity';
import { FamilyEntity }                   from './family.entity';
import { AccountEntity }                  from './account.entity';
import { InvestmentContributionEntity }    from './investment-contribution.entity';

export enum InvestmentType {
  STOCKS = 'STOCKS', BONDS = 'BONDS', REAL_ESTATE = 'REAL_ESTATE',
  CRYPTO = 'CRYPTO', SAVINGS = 'SAVINGS', PENSION = 'PENSION', OTHER = 'OTHER',
}

@Entity('investments')
export class InvestmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
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

  @Column({ type: 'enum', enum: InvestmentType })
  type: InvestmentType;

  @Column({ nullable: true, length: 150 })
  institution: string;

  @Column({ nullable: true, length: 20 })
  ticker: string;

  @Column({ type: 'decimal', precision: 15, scale: 6, default: 0 })
  quantity: number;

  @Column({ name: 'average_price', type: 'decimal', precision: 15, scale: 6, default: 0 })
  averagePrice: number;

  @Column({ name: 'current_price', type: 'decimal', precision: 15, scale: 6, default: 0 })
  currentPrice: number;

  @Column({ name: 'invested_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  investedAmount: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  profitability: number;

  @Column({ length: 3, default: 'BRL' })
  currency: string;

  @Column({ name: 'start_date', type: 'date', default: () => 'CURRENT_DATE' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => InvestmentContributionEntity, (c) => c.investment)
  contributions: InvestmentContributionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
