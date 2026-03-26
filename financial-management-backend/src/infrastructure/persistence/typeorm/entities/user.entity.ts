import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, OneToMany, Index,
} from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';

export enum UserRole   { ADMIN = 'ADMIN', TITULAR = 'TITULAR', MEMBRO = 'MEMBRO_FAMILIAR' }
export enum UserStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', PENDING = 'PENDING_VERIFICATION', SUSPENDED = 'SUSPENDED' }

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true, where: 'deleted_at IS NULL' })
  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ nullable: true, select: false })
  cpf: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TITULAR })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', nullable: true, type: 'timestamptz' })
  emailVerifiedAt: Date;

  @Column({ name: 'password_reset_token', nullable: true, select: false })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires', nullable: true, type: 'timestamptz', select: false })
  passwordResetExpires: Date;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamptz' })
  lastLoginAt: Date;

  @Column({ name: 'lgpd_consent', default: false })
  lgpdConsent: boolean;

  @Column({ name: 'lgpd_consent_at', nullable: true, type: 'timestamptz' })
  lgpdConsentAt: Date;

  @OneToMany(() => RefreshTokenEntity, (token) => token.user)
  refreshTokens: RefreshTokenEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;
}
