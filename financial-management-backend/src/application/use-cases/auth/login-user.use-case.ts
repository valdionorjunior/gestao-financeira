import {
  Injectable, UnauthorizedException, Inject, ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../../domain/repositories/refresh-token.repository.interface';
import { LoginDto } from '../../dtos/auth/login.dto';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive()) {
      throw new ForbiddenException('Conta inativa ou suspensa');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, ipAddress, userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn') as any,
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt, ipAddress, userAgent);

    return { accessToken, refreshToken };
  }
}
