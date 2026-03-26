import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { TokenBlacklistService } from '../../infrastructure/services/token-blacklist.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') as string,
      passReqToCallback: true,
    } as any);
  }

  async validate(request: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      throw new UnauthorizedException('Token não informado');
    }
    const blacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedException('Token revogado');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return { userId: user.id, email: user.email, role: user.role };
  }
}
