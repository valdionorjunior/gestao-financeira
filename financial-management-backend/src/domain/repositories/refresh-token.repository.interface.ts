export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string): Promise<void>;
  findByToken(token: string): Promise<{ id: string; userId: string; isRevoked: boolean; expiresAt: Date } | null>;
  revokeByToken(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('IRefreshTokenRepository');
