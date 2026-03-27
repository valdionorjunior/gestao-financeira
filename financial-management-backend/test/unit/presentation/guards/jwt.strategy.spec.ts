import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '@presentation/guards/jwt.strategy';
import { UserRole, UserStatus } from '@domain/entities/user.entity';

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'),
};

const mockUserRepository = {
  findById: jest.fn(),
};

const mockTokenBlacklistService = {
  isBlacklisted: jest.fn(),
};

const activeUser = {
  id: 'user-uuid-1',
  email: 'joao@example.com',
  role: UserRole.TITULAR,
  status: UserStatus.ACTIVE,
  isActive: () => true,
};

function makeRequest(token: string) {
  return {
    headers: { authorization: `Bearer ${token}` },
  } as any;
}

describe('JwtStrategy.validate()', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-secret');
    strategy = new JwtStrategy(
      mockConfigService as any,
      mockUserRepository as any,
      mockTokenBlacklistService as any,
    );
  });

  it('should return user payload for valid token', async () => {
    mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
    mockUserRepository.findById.mockResolvedValue(activeUser);

    const payload = { sub: 'user-uuid-1', email: 'joao@example.com', role: UserRole.TITULAR, iat: 0, exp: 9999999999 };
    const request = makeRequest('valid-jwt-token');

    const result = await strategy.validate(request, payload);

    expect(result).toEqual({ userId: 'user-uuid-1', email: 'joao@example.com', role: UserRole.TITULAR });
  });

  it('should throw UnauthorizedException when token is blacklisted', async () => {
    mockTokenBlacklistService.isBlacklisted.mockResolvedValue(true);

    const payload = { sub: 'user-uuid-1', email: 'joao@example.com', role: UserRole.TITULAR, iat: 0, exp: 9999999999 };
    const request = makeRequest('blacklisted-token');

    await expect(strategy.validate(request, payload)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(request, payload)).rejects.toThrow('Token revogado');
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
    mockUserRepository.findById.mockResolvedValue(null);

    const payload = { sub: 'ghost-uuid', email: 'ghost@x.com', role: UserRole.TITULAR, iat: 0, exp: 9999999999 };
    const request = makeRequest('valid-jwt-token');

    await expect(strategy.validate(request, payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is inactive', async () => {
    mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
    mockUserRepository.findById.mockResolvedValue({
      ...activeUser,
      status: UserStatus.SUSPENDED,
      isActive: () => false,
    });

    const payload = { sub: 'user-uuid-1', email: 'joao@example.com', role: UserRole.TITULAR, iat: 0, exp: 9999999999 };
    const request = makeRequest('valid-jwt-token');

    await expect(strategy.validate(request, payload)).rejects.toThrow(UnauthorizedException);
  });
});
