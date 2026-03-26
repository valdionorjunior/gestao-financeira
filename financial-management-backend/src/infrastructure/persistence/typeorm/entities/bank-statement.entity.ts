import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { AccountEntity }          from './account.entity';
import { UserEntity }             from './user.entity';
import { BankStatementItemEntity } from './bank-statement-item.entity';

export enum BankStatementFileType { OFX = 'OFX', CSV = 'CSV', QIF = 'QIF' }
export enum BankStatementStatus   { PENDING = 'PENDING', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED', FAILED = 'FAILED' }

@Entity('bank_statements')
export class BankStatementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_type', type: 'enum', enum: BankStatementFileType })
  fileType: BankStatementFileType;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ type: 'enum', enum: BankStatementStatus, default: BankStatementStatus.PENDING })
  status: BankStatementStatus;

  @Column({ name: 'total_transactions', default: 0 })
  totalTransactions: number;

  @Column({ name: 'matched_transactions', default: 0 })
  matchedTransactions: number;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd: string;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @OneToMany(() => BankStatementItemEntity, (item) => item.statement)
  items: BankStatementItemEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
