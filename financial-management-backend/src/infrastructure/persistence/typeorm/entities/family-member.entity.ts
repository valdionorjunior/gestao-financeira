import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { FamilyEntity } from './family.entity';
import { UserEntity } from './user.entity';

export enum FamilyMemberRole   { TITULAR = 'TITULAR', MEMBRO = 'MEMBRO_FAMILIAR' }
export enum FamilyMemberStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', PENDING = 'PENDING' }

@Entity('family_members')
@Unique(['familyId', 'userId'])
export class FamilyMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FamilyEntity, (family) => family.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family: FamilyEntity;

  @Column({ name: 'family_id' })
  familyId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: FamilyMemberRole, default: FamilyMemberRole.MEMBRO })
  role: FamilyMemberRole;

  @Column({ type: 'enum', enum: FamilyMemberStatus, default: FamilyMemberStatus.PENDING })
  status: FamilyMemberStatus;

  @Column({ name: 'invited_at', type: 'timestamptz', default: () => 'NOW()' })
  invitedAt: Date;

  @Column({ name: 'joined_at', nullable: true, type: 'timestamptz' })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
