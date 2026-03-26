import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async blacklist(token: string, ttlSeconds = 900): Promise<void> {
    await this.client.setex(`bl:${token}`, ttlSeconds, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`bl:${token}`);
    return result === '1';
  }
}
