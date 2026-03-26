import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { BankStatementEntity } from './bank-statement.entity';
import { TransactionEntity }   from './transaction.entity';

export enum StatementItemType   { DEBIT = 'DEBIT', CREDIT = 'CREDIT' }
export enum StatementItemStatus { PENDING = 'PENDING', MATCHED = 'MATCHED', UNMATCHED = 'UNMATCHED', IGNORED = 'IGNORED' }

@Entity('bank_statement_items')
export class BankStatementItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BankStatementEntity, (stmt) => stmt.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statement_id' })
  statement: BankStatementEntity;

  @Column({ name: 'statement_id' })
  statementId: string;

  @ManyToOne(() => TransactionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 500 })
  description: string;

  @Column({ type: 'enum', enum: StatementItemType })
  type: StatementItemType;

  @Column({ type: 'enum', enum: StatementItemStatus, default: StatementItemStatus.PENDING })
  status: StatementItemStatus;

  @Column({ name: 'raw_data', nullable: true, type: 'jsonb' })
  rawData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
