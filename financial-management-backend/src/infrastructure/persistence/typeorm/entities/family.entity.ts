import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FamilyMemberEntity } from './family-member.entity';

@Entity('families')
export class FamilyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToMany(() => FamilyMemberEntity, (member) => member.family)
  members: FamilyMemberEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
