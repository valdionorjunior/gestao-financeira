import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../persistence/typeorm/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const entity = this.repo.create({ userId, token, expiresAt, ipAddress, userAgent });
    await this.repo.save(entity);
  }

  async findByToken(token: string): Promise<{ id: string; userId: string; isRevoked: boolean; expiresAt: Date } | null> {
    const row = await this.repo
      .createQueryBuilder('rt')
      .addSelect('rt.token')
      .where('rt.token = :token', { token })
      .getOne();
    if (!row) return null;
    return { id: row.id, userId: row.userId, isRevoked: row.isRevoked, expiresAt: row.expiresAt };
  }

  async revokeByToken(token: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshTokenEntity)
      .set({ isRevoked: true })
      .where('token = :token', { token })
      .execute();
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
