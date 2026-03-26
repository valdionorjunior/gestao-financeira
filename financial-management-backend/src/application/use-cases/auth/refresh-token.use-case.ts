import {
  Injectable, UnauthorizedException, Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/repositories/refresh-token.repository.interface';
import { LoginUserUseCase } from './login-user.use-case';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  async execute(token: string, ipAddress?: string, userAgent?: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const stored = await this.refreshTokenRepository.findByToken(token);
    if (!stored || stored.isRevoked) {
      // Token reuse — revogar todos os tokens do usuário
      if (stored) {
        await this.refreshTokenRepository.revokeAllByUserId(stored.userId);
      }
      throw new UnauthorizedException('Token reutilizado detectado — faça login novamente');
    }

    if (new Date() > stored.expiresAt) {
      await this.refreshTokenRepository.revokeByToken(token);
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Rotation: revoga token atual e emite novo par
    await this.refreshTokenRepository.revokeByToken(token);
    const tokens = await this.loginUserUseCase.generateTokenPair(
      user.id, user.email, user.role, ipAddress, userAgent,
    );

    return tokens;
  }
}
