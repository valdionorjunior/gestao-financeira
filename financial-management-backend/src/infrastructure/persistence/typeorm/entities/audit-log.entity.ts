import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index()
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Index()
  @Column({ length: 50 })
  action: string;

  @Index()
  @Column({ length: 100 })
  entity: string;

  @Column({ name: 'entity_id', nullable: true, type: 'uuid' })
  entityId: string;

  @Column({ name: 'old_value', nullable: true, type: 'jsonb' })
  oldValue: Record<string, any>;

  @Column({ name: 'new_value', nullable: true, type: 'jsonb' })
  newValue: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
