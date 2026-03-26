import { Injectable, Inject } from '@nestjs/common';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/repositories/refresh-token.repository.interface';
import { TokenBlacklistService } from '../../../infrastructure/services/token-blacklist.service';

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async execute(accessToken: string, refreshToken?: string, userId?: string): Promise<void> {
    // Blacklist do access token no Redis
    await this.tokenBlacklistService.blacklist(accessToken);

    // Revogar refresh token específico ou todos do usuário
    if (refreshToken) {
      await this.refreshTokenRepository.revokeByToken(refreshToken);
    } else if (userId) {
      await this.refreshTokenRepository.revokeAllByUserId(userId);
    }
  }
}
