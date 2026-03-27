import { TokenBlacklistService } from '@infrastructure/services/token-blacklist.service';
import { ConfigService } from '@nestjs/config';

const mockRedisClient = {
  setex: jest.fn(),
  get: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient);
});

function makeService() {
  const config = {
    get: jest.fn((key: string, fallback?: any) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return fallback;
    }),
  } as unknown as ConfigService;
  const svc = new TokenBlacklistService(config);
  svc.onModuleInit();
  return svc;
}

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = makeService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('blacklist()', () => {
    it('should store token in Redis with default TTL of 900s', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');
      await service.blacklist('test-token');
      expect(mockRedisClient.setex).toHaveBeenCalledWith('bl:test-token', 900, '1');
    });

    it('should store token with custom TTL when provided', async () => {
      mockRedisClient.setex.mockResolvedValue('OK');
      await service.blacklist('custom-token', 3600);
      expect(mockRedisClient.setex).toHaveBeenCalledWith('bl:custom-token', 3600, '1');
    });
  });

  describe('isBlacklisted()', () => {
    it('should return true when token is in blacklist', async () => {
      mockRedisClient.get.mockResolvedValue('1');
      const result = await service.isBlacklisted('blacklisted-token');
      expect(result).toBe(true);
      expect(mockRedisClient.get).toHaveBeenCalledWith('bl:blacklisted-token');
    });

    it('should return false when token is not in blacklist', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const result = await service.isBlacklisted('valid-token');
      expect(result).toBe(false);
    });

    it('should return false when Redis returns value other than "1"', async () => {
      mockRedisClient.get.mockResolvedValue('0');
      const result = await service.isBlacklisted('some-token');
      expect(result).toBe(false);
    });
  });

  describe('onModuleDestroy()', () => {
    it('should disconnect from Redis on module destroy', () => {
      service.onModuleDestroy();
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });
});
