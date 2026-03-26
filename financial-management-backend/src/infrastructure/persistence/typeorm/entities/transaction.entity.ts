import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserEntity }        from './user.entity';
import { AccountEntity }     from './account.entity';
import { FamilyEntity }      from './family.entity';
import { CategoryEntity }    from './category.entity';
import { SubcategoryEntity } from './subcategory.entity';

export enum TransactionType   { INCOME = 'INCOME', EXPENSE = 'EXPENSE', TRANSFER = 'TRANSFER' }
export enum PaymentMethod     { CASH = 'CASH', DEBIT_CARD = 'DEBIT_CARD', CREDIT_CARD = 'CREDIT_CARD', TRANSFER = 'TRANSFER', PIX = 'PIX', BOLETO = 'BOLETO', OTHER = 'OTHER' }
export enum TransactionStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', CANCELED = 'CANCELED', RECONCILED = 'RECONCILED' }

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Index()
  @Column({ name: 'account_id' })
  accountId: string;

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

  @ManyToOne(() => SubcategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: SubcategoryEntity;

  @Column({ name: 'subcategory_id', nullable: true })
  subcategoryId: string;

  @ManyToOne(() => AccountEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: AccountEntity;

  @Column({ name: 'destination_account_id', nullable: true })
  destinationAccountId: string;

  @Column({ name: 'transfer_pair_id', nullable: true, type: 'uuid' })
  transferPairId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 255 })
  description: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, default: PaymentMethod.OTHER })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.CONFIRMED })
  status: TransactionStatus;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurring_group_id', nullable: true, type: 'uuid' })
  recurringGroupId: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ name: 'receipt_url', nullable: true, length: 500 })
  receiptUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;
}
