import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../persistence/typeorm/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  private toEntity(row: UserEntity): User {
    const user = new User();
    Object.assign(user, row);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id AND u.deleted_at IS NULL', { id })
      .getOne();
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.email) = LOWER(:email) AND u.deleted_at IS NULL', { email })
      .getOne();
    return row ? this.toEntity(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { googleId } });
    return row ? this.toEntity(row) : null;
  }

  async save(data: Partial<User>): Promise<User> {
    const entity = this.repo.create(data as Partial<UserEntity>);
    const saved = await this.repo.save(entity);
    return this.toEntity(saved);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data as Partial<UserEntity>);
    return this.findById(id) as Promise<User>;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }
}
