import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FamilyEntity } from './family.entity';

export enum AccountType {
  CHECKING     = 'CHECKING',
  SAVINGS      = 'SAVINGS',
  CREDIT_CARD  = 'CREDIT_CARD',
  INVESTMENT   = 'INVESTMENT',
  CASH         = 'CASH',
  OTHER        = 'OTHER',
}

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => FamilyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'family_id' })
  family: FamilyEntity;

  @Column({ name: 'family_id', nullable: true })
  familyId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: AccountType, default: AccountType.CHECKING })
  type: AccountType;

  @Column({ name: 'bank_name', nullable: true, length: 150 })
  bankName: string;

  @Column({ name: 'bank_code', nullable: true, length: 10 })
  bankCode: string;

  @Column({ nullable: true, select: false })
  agency: string;

  @Column({ name: 'account_number', nullable: true, select: false })
  accountNumber: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditLimit: number;

  @Column({ length: 3, default: 'BRL' })
  currency: string;

  @Column({ nullable: true, length: 7, default: '#17c1e8' })
  color: string;

  @Column({ nullable: true, length: 50 })
  icon: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'include_in_total', default: true })
  includeInTotal: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;
}
